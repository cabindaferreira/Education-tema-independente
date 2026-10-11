import { and, eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CheckRoomAvailabilityBody,
  CheckRoomAvailabilityResponse,
  CreateRoomReservationBody,
  CreateRoomReservationResponse,
  ListRoomsResponse,
} from "@workspace/api-zod";
import { db, roomReservationsTable } from "@workspace/db";
import {
  buildRoomSlots,
  getRoom,
  hasRoom,
  isTodayOrFuture,
  isValidRoomPeriod,
  rooms,
  slotHasStarted,
  slotsOverlap,
} from "../lib/rooms";

const router: IRouter = Router();

router.get("/rooms", (_req, res): void => {
  res.json(ListRoomsResponse.parse(rooms));
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
