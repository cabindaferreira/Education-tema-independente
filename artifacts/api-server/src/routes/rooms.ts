import { and, eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import {
  CancelRoomReservationParams,
  CancelRoomReservationResponse,
  CheckRoomAvailabilityBody,
  CheckRoomAvailabilityResponse,
  CreateRoomReservationBody,
  CreateRoomReservationResponse,
  ListRoomReservationsQueryParams,
  ListRoomReservationsResponse,
  ListRoomsResponse,
} from "@workspace/api-zod";
import { db, roomReservationsTable } from "@workspace/db";
import {
  buildRoomSlots,
  getRoom,
  hasRoom,
  isTodayOrFuture,
  isValidBookingDate,
  isValidRoomPeriod,
  rooms,
  slotHasStarted,
  slotsOverlap,
} from "../lib/rooms";

const router: IRouter = Router();

async function requireRoomStaff(req: Parameters<typeof getAuth>[0], res: import("express").Response): Promise<boolean> {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Inicie sessão para continuar." });
    return false;
  }

  const user = await clerkClient.users.getUser(userId);
  if (user.privateMetadata.academyRole !== "room_staff") {
    res.status(403).json({ error: "Esta área está reservada à equipa da Academia." });
    return false;
  }

  return true;
}

function staffReservationResponse(reservation: {
  id: number;
  roomId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceKz: number;
  status: string;
  name: string;
  company: string | null;
}) {
  if (!hasRoom(reservation.roomId)) {
    throw new Error("A sala desta reserva já não está disponível.");
  }

  return {
    id: reservation.id,
    roomId: reservation.roomId,
    roomName: getRoom(reservation.roomId).name,
    date: reservation.bookingDate,
    startTime: reservation.startTime.slice(0, 5),
    endTime: reservation.endTime.slice(0, 5),
    durationMinutes: reservation.durationMinutes,
    priceKz: reservation.priceKz,
    status: reservation.status,
    name: reservation.name,
    company: reservation.company,
  };
}

router.get("/rooms", (_req, res): void => {
  res.json(ListRoomsResponse.parse(rooms));
});

router.get("/room-reservations", async (req, res): Promise<void> => {
  if (!(await requireRoomStaff(req, res))) return;

  const parsed = ListRoomReservationsQueryParams.safeParse(req.query);
  if (!parsed.success || !isValidBookingDate(parsed.data.date)) {
    res.status(400).json({ error: "Indique uma sala e uma data válidas." });
    return;
  }

  const reservations = await db
    .select({
      id: roomReservationsTable.id,
      roomId: roomReservationsTable.roomId,
      bookingDate: roomReservationsTable.bookingDate,
      startTime: roomReservationsTable.startTime,
      endTime: roomReservationsTable.endTime,
      durationMinutes: roomReservationsTable.durationMinutes,
      priceKz: roomReservationsTable.priceKz,
      status: roomReservationsTable.status,
      name: roomReservationsTable.name,
      company: roomReservationsTable.company,
    })
    .from(roomReservationsTable)
    .where(and(
      eq(roomReservationsTable.roomId, parsed.data.roomId),
      eq(roomReservationsTable.bookingDate, parsed.data.date),
    ))
    .orderBy(roomReservationsTable.startTime);

  res.json(ListRoomReservationsResponse.parse(reservations.map(staffReservationResponse)));
});

router.patch("/room-reservations/:id/cancel", async (req, res): Promise<void> => {
  if (!(await requireRoomStaff(req, res))) return;

  const parsed = CancelRoomReservationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Identificador de reserva inválido." });
    return;
  }

  const [updated] = await db
    .update(roomReservationsTable)
    .set({ status: "cancelled" })
    .where(and(
      eq(roomReservationsTable.id, parsed.data.id),
      eq(roomReservationsTable.status, "confirmed"),
    ))
    .returning({
      id: roomReservationsTable.id,
      roomId: roomReservationsTable.roomId,
      bookingDate: roomReservationsTable.bookingDate,
      startTime: roomReservationsTable.startTime,
      endTime: roomReservationsTable.endTime,
      durationMinutes: roomReservationsTable.durationMinutes,
      priceKz: roomReservationsTable.priceKz,
      status: roomReservationsTable.status,
      name: roomReservationsTable.name,
      company: roomReservationsTable.company,
    });

  if (updated) {
    res.json(CancelRoomReservationResponse.parse(staffReservationResponse(updated)));
    return;
  }

  const [existing] = await db
    .select({
      id: roomReservationsTable.id,
      roomId: roomReservationsTable.roomId,
      bookingDate: roomReservationsTable.bookingDate,
      startTime: roomReservationsTable.startTime,
      endTime: roomReservationsTable.endTime,
      durationMinutes: roomReservationsTable.durationMinutes,
      priceKz: roomReservationsTable.priceKz,
      status: roomReservationsTable.status,
      name: roomReservationsTable.name,
      company: roomReservationsTable.company,
    })
    .from(roomReservationsTable)
    .where(eq(roomReservationsTable.id, parsed.data.id));

  if (!existing) {
    res.status(404).json({ error: "A reserva não foi encontrada." });
    return;
  }

  res.json(CancelRoomReservationResponse.parse(staffReservationResponse(existing)));
});

router.post("/room-availability", async (req, res): Promise<void> => {
  const parsed = CheckRoomAvailabilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados de disponibilidade inválidos." });
    return;
  }

  const input = parsed.data;
  if (!isTodayOrFuture(input.date)) {
    res.status(400).json({ error: "Escolha uma data de hoje em diante." });
    return;
  }
  if (!isValidRoomPeriod(input.roomId, input.period, input.durationHours)) {
    res.status(400).json({ error: "A duração ou o período não corresponde às condições desta sala." });
    return;
  }

  const bookedSlots = await db
    .select({ startTime: roomReservationsTable.startTime, endTime: roomReservationsTable.endTime })
    .from(roomReservationsTable)
    .where(and(
      eq(roomReservationsTable.roomId, input.roomId),
      eq(roomReservationsTable.bookingDate, input.date),
      eq(roomReservationsTable.status, "confirmed"),
    ));

  const slots = buildRoomSlots(input.roomId, input.date, input.period, input.durationHours)
    .filter((slot) => !slotHasStarted(input.date, slot))
    .filter((slot) => !bookedSlots.some((booked) => slotsOverlap(slot, booked)));

  res.json(CheckRoomAvailabilityResponse.parse({
    roomId: input.roomId,
    date: input.date,
    slots,
  }));
});

router.post("/room-reservations", async (req, res): Promise<void> => {
  const parsed = CreateRoomReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Preencha corretamente os dados da reserva." });
    return;
  }

  const input = parsed.data;
  const name = input.name.trim();
  const nif = input.nif.trim();
  const company = input.company?.trim() || null;
  if (name.length < 2 || nif.length < 3 || company && company.length > 160) {
    res.status(400).json({ error: "Verifique o nome, NIF e empresa." });
    return;
  }
  if (!isTodayOrFuture(input.date)) {
    res.status(400).json({ error: "Escolha uma data de hoje em diante." });
    return;
  }
  if (!isValidRoomPeriod(input.roomId, input.period, input.durationHours)) {
    res.status(400).json({ error: "A duração ou o período não corresponde às condições desta sala." });
    return;
  }

  const validSlots = buildRoomSlots(input.roomId, input.date, input.period, input.durationHours);
  const requestedSlot = validSlots.find((slot) => slot.id === input.slotId);
  if (!requestedSlot) {
    res.status(400).json({ error: "O horário selecionado não corresponde a uma opção válida." });
    return;
  }

  const room = getRoom(input.roomId);
  const reservation = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.roomId}), hashtext(${input.date}))`);

    const bookedSlots = await tx
      .select({ startTime: roomReservationsTable.startTime, endTime: roomReservationsTable.endTime })
      .from(roomReservationsTable)
      .where(and(
        eq(roomReservationsTable.roomId, input.roomId),
        eq(roomReservationsTable.bookingDate, input.date),
        eq(roomReservationsTable.status, "confirmed"),
      ));

    if (slotHasStarted(input.date, requestedSlot) || bookedSlots.some((booked) => slotsOverlap(requestedSlot, booked))) {
      return null;
    }

    const [created] = await tx
      .insert(roomReservationsTable)
      .values({
        roomId: input.roomId,
        bookingDate: input.date,
        startTime: requestedSlot.startTime,
        endTime: requestedSlot.endTime,
        durationMinutes: requestedSlot.durationMinutes,
        priceKz: requestedSlot.priceKz,
        name,
        company,
        nif,
        status: "confirmed",
      })
      .returning({
        id: roomReservationsTable.id,
        roomId: roomReservationsTable.roomId,
        bookingDate: roomReservationsTable.bookingDate,
        startTime: roomReservationsTable.startTime,
        endTime: roomReservationsTable.endTime,
        durationMinutes: roomReservationsTable.durationMinutes,
        priceKz: roomReservationsTable.priceKz,
        status: roomReservationsTable.status,
      });

    return created;
  });

  if (!reservation) {
    res.status(409).json({ error: "Este horário acabou de ser reservado. Escolha outra vaga." });
    return;
  }

  if (!hasRoom(reservation.roomId)) {
    res.status(500).json({ error: "A sala desta reserva já não está disponível." });
    return;
  }

  res.status(201).json(CreateRoomReservationResponse.parse({
    id: reservation.id,
    roomId: reservation.roomId,
    roomName: room.name,
    date: reservation.bookingDate,
    startTime: reservation.startTime.slice(0, 5),
    endTime: reservation.endTime.slice(0, 5),
    durationMinutes: reservation.durationMinutes,
    priceKz: reservation.priceKz,
    status: reservation.status,
  }));
});

export default router;
