import { and, eq, isNull, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import {
  CancelRoomReservationParams,
  CancelRoomReservationResponse,
  CheckRoomAvailabilityBody,
  CheckRoomAvailabilityResponse,
  CreateRoomReservationBody,
  CreateRoomReservationResponse,
  GetRoomBookingSettingsResponse,
  ListRoomReservationsQueryParams,
  ListRoomReservationsResponse,
  ListRoomPhotosResponse,
  ListRoomsResponse,
  UpdateRoomBookingSettingsBody,
  UpdateRoomBookingSettingsResponse,
} from "@workspace/api-zod";
import { academyMediaTable, db, roomAvailabilityBlocksTable, roomBookingSettingsTable, roomReservationsTable } from "@workspace/db";
import { bootstrapConfiguredOwner } from "../lib/admin-auth";
import {
  buildRoomSlots,
  defaultRoomBookingSettings,
  filterAvailableRoomSlots,
  filterRoomReservationsForStaff,
  getRoom,
  getRooms,
  hasRoom,
  hasRoomStaffAccess,
  isTodayOrFuture,
  isValidBookingDate,
  isValidRoomPeriod,
  roomStaffReservationResponse,
  slotHasStarted,
  slotsOverlap,
  type RoomBookingRules,
  type RoomBookingSettings,
} from "../lib/rooms";

const router: IRouter = Router();
const bookingSettingsId = 1;

async function loadRoomBookingSettings(): Promise<RoomBookingSettings> {
  let [record] = await db
    .select({ settings: roomBookingSettingsTable.settings })
    .from(roomBookingSettingsTable)
    .where(eq(roomBookingSettingsTable.id, bookingSettingsId));

  if (!record) {
    await db
      .insert(roomBookingSettingsTable)
      .values({ id: bookingSettingsId, settings: defaultRoomBookingSettings })
      .onConflictDoNothing();
    [record] = await db
      .select({ settings: roomBookingSettingsTable.settings })
      .from(roomBookingSettingsTable)
      .where(eq(roomBookingSettingsTable.id, bookingSettingsId));
  }

  if (!record) throw new Error("Não foi possível carregar as regras de reserva das salas.");
  return record.settings as RoomBookingSettings;
}

function timeMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value)
    && Number(value.slice(0, 2)) < 24
    && Number(value.slice(3, 5)) < 60;
}

function validateSettings(settings: RoomBookingSettings): string | null {
  if (new Set(settings.holidayDates).size !== settings.holidayDates.length
    || settings.holidayDates.some((date) => !isValidBookingDate(date))) {
    return "A lista de feriados contém datas inválidas ou repetidas.";
  }

  for (const roomId of ["sala-soba", "sala-kilamba", "sala-kudi", "sala-ondjango"] as const) {
    const rules: RoomBookingRules = settings.roomRules[roomId];
    const times = [
      rules.standardStartTime, rules.standardEndTime,
      rules.afterHoursStartTime, rules.afterHoursEndTime,
      rules.sessionMorningStartTime, rules.sessionMorningEndTime,
      rules.sessionAfternoonStartTime, rules.sessionAfternoonEndTime,
    ];
    if (times.some((time) => !isValidTime(time))) return "Indique horários válidos no formato HH:MM.";

    const standardStart = timeMinutes(rules.standardStartTime);
    const standardEnd = timeMinutes(rules.standardEndTime);
    const afterStart = timeMinutes(rules.afterHoursStartTime);
    const afterEnd = timeMinutes(rules.afterHoursEndTime);
    const morningStart = timeMinutes(rules.sessionMorningStartTime);
    const morningEnd = timeMinutes(rules.sessionMorningEndTime);
    const afternoonStart = timeMinutes(rules.sessionAfternoonStartTime);
    const afternoonEnd = timeMinutes(rules.sessionAfternoonEndTime);

    if (standardStart >= standardEnd
      || standardEnd - standardStart < rules.standardMinimumHours * 60
      || afterStart < standardEnd
      || afterStart >= afterEnd
      || afterEnd > 24 * 60
      || morningStart >= morningEnd
      || morningEnd > afternoonStart
      || afternoonStart >= afternoonEnd) {
      return "Os horários de cada sala têm de estar ordenados e sem períodos sobrepostos.";
    }
  }
  return null;
}

async function requireRoomStaff(
  req: Parameters<typeof getAuth>[0],
  res: import("express").Response,
): Promise<{ userId: string; displayName: string } | null> {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Inicie sessão para continuar." });
    return null;
  }

  const user = await bootstrapConfiguredOwner(await clerkClient.users.getUser(userId));
  const metadata = user.privateMetadata as Record<string, unknown>;
  if (!hasRoomStaffAccess(metadata)) {
    res.status(403).json({ error: "Esta área está reservada à equipa da Academia." });
    return null;
  }

  return {
    userId,
    displayName: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || userId,
  };
}

router.get("/rooms", async (_req, res): Promise<void> => {
  const settings = await loadRoomBookingSettings();
  res.json(ListRoomsResponse.parse(getRooms(settings)));
});

router.get("/rooms/:roomId/photos", async (req, res): Promise<void> => {
  const roomId = String(req.params.roomId);
  if (!hasRoom(roomId)) {
    res.status(404).json({ error: "A sala não foi encontrada." });
    return;
  }
  const photos = await db
    .select({
      id: academyMediaTable.id,
      title: academyMediaTable.title,
      altText: academyMediaTable.altText,
      objectPath: academyMediaTable.objectPath,
      sortOrder: academyMediaTable.sortOrder,
    })
    .from(academyMediaTable)
    .where(and(eq(academyMediaTable.roomId, roomId), isNull(academyMediaTable.archivedAt)))
    .orderBy(academyMediaTable.sortOrder, academyMediaTable.createdAt, academyMediaTable.id);
  res.json(ListRoomPhotosResponse.parse(photos.map((photo) => ({
    ...photo,
    url: `/api/storage${photo.objectPath}`,
  }))));
});

router.get("/room-booking-settings", async (req, res): Promise<void> => {
  if (!(await requireRoomStaff(req, res))) return;
  const settings = await loadRoomBookingSettings();
  res.json(GetRoomBookingSettingsResponse.parse(settings));
});

router.put("/room-booking-settings", async (req, res): Promise<void> => {
  if (!(await requireRoomStaff(req, res))) return;
  const parsed = UpdateRoomBookingSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Verifique os preços, horários e datas de feriado." });
    return;
  }
  const settings = parsed.data as RoomBookingSettings;
  const validationError = validateSettings(settings);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('room-booking-settings'))`);
    await tx
      .insert(roomBookingSettingsTable)
      .values({ id: bookingSettingsId, settings })
      .onConflictDoUpdate({
        target: roomBookingSettingsTable.id,
        set: { settings },
      });
  });

  res.json(UpdateRoomBookingSettingsResponse.parse(settings));
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
      cancelledByName: roomReservationsTable.cancelledByName,
      cancelledAt: roomReservationsTable.cancelledAt,
    })
    .from(roomReservationsTable)
    .where(and(
      eq(roomReservationsTable.roomId, parsed.data.roomId),
      eq(roomReservationsTable.bookingDate, parsed.data.date),
    ))
    .orderBy(roomReservationsTable.startTime);

  res.json(ListRoomReservationsResponse.parse(
    filterRoomReservationsForStaff(reservations, parsed.data.roomId, parsed.data.date)
      .map(roomStaffReservationResponse),
  ));
});

router.patch("/room-reservations/:id/cancel", async (req, res): Promise<void> => {
  const staff = await requireRoomStaff(req, res);
  if (!staff) return;

  const parsed = CancelRoomReservationParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Identificador de reserva inválido." });
    return;
  }

  const [updated] = await db
    .update(roomReservationsTable)
    .set({
      status: "cancelled",
      cancelledByUserId: staff.userId,
      cancelledByName: staff.displayName,
      cancelledAt: new Date(),
    })
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
      cancelledByName: roomReservationsTable.cancelledByName,
      cancelledAt: roomReservationsTable.cancelledAt,
    });

  if (updated) {
    res.json(CancelRoomReservationResponse.parse(roomStaffReservationResponse(updated)));
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
      cancelledByName: roomReservationsTable.cancelledByName,
      cancelledAt: roomReservationsTable.cancelledAt,
    })
    .from(roomReservationsTable)
    .where(eq(roomReservationsTable.id, parsed.data.id));

  if (!existing) {
    res.status(404).json({ error: "A reserva não foi encontrada." });
    return;
  }

  res.json(CancelRoomReservationResponse.parse(roomStaffReservationResponse(existing)));
});

router.post("/room-availability", async (req, res): Promise<void> => {
  const parsed = CheckRoomAvailabilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados de disponibilidade inválidos." });
    return;
  }

  const input = parsed.data;
  const settings = await loadRoomBookingSettings();
  if (!isTodayOrFuture(input.date)) {
    res.status(400).json({ error: "Escolha uma data de hoje em diante." });
    return;
  }
  if (!isValidRoomPeriod(input.roomId, input.period, input.durationHours, settings)) {
    res.status(400).json({ error: "A duração ou o período não corresponde às condições desta sala." });
    return;
  }

  const bookedSlots = await db
    .select({
      startTime: roomReservationsTable.startTime,
      endTime: roomReservationsTable.endTime,
      status: roomReservationsTable.status,
    })
    .from(roomReservationsTable)
    .where(and(
      eq(roomReservationsTable.roomId, input.roomId),
      eq(roomReservationsTable.bookingDate, input.date),
    ));
  const blockedSlots = await db
    .select({ startTime: roomAvailabilityBlocksTable.startTime, endTime: roomAvailabilityBlocksTable.endTime })
    .from(roomAvailabilityBlocksTable)
    .where(and(
      eq(roomAvailabilityBlocksTable.roomId, input.roomId),
      eq(roomAvailabilityBlocksTable.bookingDate, input.date),
      isNull(roomAvailabilityBlocksTable.releasedAt),
    ));

  const slots = filterAvailableRoomSlots(
    buildRoomSlots(input.roomId, input.date, input.period, input.durationHours, settings),
    bookedSlots,
  )
    .filter((slot) => !slotHasStarted(input.date, slot))
    .filter((slot) => !blockedSlots.some((block) => slotsOverlap(slot, block)));

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
  const settings = await loadRoomBookingSettings();
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
  if (!isValidRoomPeriod(input.roomId, input.period, input.durationHours, settings)) {
    res.status(400).json({ error: "A duração ou o período não corresponde às condições desta sala." });
    return;
  }

  const validSlots = buildRoomSlots(input.roomId, input.date, input.period, input.durationHours, settings);
  const requestedSlot = validSlots.find((slot) => slot.id === input.slotId);
  if (!requestedSlot) {
    res.status(400).json({ error: "O horário selecionado não corresponde a uma opção válida." });
    return;
  }

  const room = getRoom(input.roomId);
  const reservation = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('room-booking-settings'))`);
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.roomId}), hashtext(${input.date}))`);
    const [settingsRecord] = await tx
      .select({ settings: roomBookingSettingsTable.settings })
      .from(roomBookingSettingsTable)
      .where(eq(roomBookingSettingsTable.id, bookingSettingsId));
    const currentSettings = (settingsRecord?.settings ?? defaultRoomBookingSettings) as RoomBookingSettings;
    const currentSlot = isValidRoomPeriod(input.roomId, input.period, input.durationHours, currentSettings)
      ? buildRoomSlots(input.roomId, input.date, input.period, input.durationHours, currentSettings)
        .find((slot) => slot.id === input.slotId)
      : undefined;
    if (!currentSlot) return null;

    const bookedSlots = await tx
      .select({ startTime: roomReservationsTable.startTime, endTime: roomReservationsTable.endTime })
      .from(roomReservationsTable)
      .where(and(
        eq(roomReservationsTable.roomId, input.roomId),
        eq(roomReservationsTable.bookingDate, input.date),
        eq(roomReservationsTable.status, "confirmed"),
      ));
    const blockedSlots = await tx
      .select({ startTime: roomAvailabilityBlocksTable.startTime, endTime: roomAvailabilityBlocksTable.endTime })
      .from(roomAvailabilityBlocksTable)
      .where(and(
        eq(roomAvailabilityBlocksTable.roomId, input.roomId),
        eq(roomAvailabilityBlocksTable.bookingDate, input.date),
        isNull(roomAvailabilityBlocksTable.releasedAt),
      ));

    if (
      slotHasStarted(input.date, currentSlot)
      || bookedSlots.some((booked) => slotsOverlap(currentSlot, booked))
      || blockedSlots.some((block) => slotsOverlap(currentSlot, block))
    ) {
      return null;
    }

    const [created] = await tx
      .insert(roomReservationsTable)
      .values({
        roomId: input.roomId,
        bookingDate: input.date,
        startTime: currentSlot.startTime,
        endTime: currentSlot.endTime,
        durationMinutes: currentSlot.durationMinutes,
        priceKz: currentSlot.priceKz,
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
