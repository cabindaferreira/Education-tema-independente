import type { ReservationPeriod, Room, RoomId, RoomSlot } from "@workspace/api-zod";

export type RoomBookingRules = {
  standardStartTime: string;
  standardEndTime: string;
  standardMinimumHours: number;
  standardHourlyRate: number;
  standardShortStayHourlyRate: number;
  standardDiscountFromHours: number;
  afterHoursStartTime: string;
  afterHoursEndTime: string;
  afterHoursPriceKz: number;
  sessionMorningStartTime: string;
  sessionMorningEndTime: string;
  sessionAfternoonStartTime: string;
  sessionAfternoonEndTime: string;
  weekdaySessionPriceKz: number;
  holidaySessionPriceKz: number;
};

export type RoomBookingSettings = {
  roomRules: Record<RoomId, RoomBookingRules>;
  holidayDates: string[];
};

export const defaultRoomBookingSettings: RoomBookingSettings = {
  roomRules: {
    "sala-soba": {
      standardStartTime: "08:00", standardEndTime: "17:00", standardMinimumHours: 6,
      standardHourlyRate: 5_000, standardShortStayHourlyRate: 5_000, standardDiscountFromHours: 6,
      afterHoursStartTime: "17:00", afterHoursEndTime: "20:00", afterHoursPriceKz: 10_500,
      sessionMorningStartTime: "07:00", sessionMorningEndTime: "12:00",
      sessionAfternoonStartTime: "12:30", sessionAfternoonEndTime: "17:00",
      weekdaySessionPriceKz: 35_000, holidaySessionPriceKz: 60_000,
    },
    "sala-kilamba": {
      standardStartTime: "08:00", standardEndTime: "17:00", standardMinimumHours: 6,
      standardHourlyRate: 4_500, standardShortStayHourlyRate: 4_500, standardDiscountFromHours: 6,
      afterHoursStartTime: "17:00", afterHoursEndTime: "20:00", afterHoursPriceKz: 10_500,
      sessionMorningStartTime: "07:00", sessionMorningEndTime: "12:00",
      sessionAfternoonStartTime: "12:30", sessionAfternoonEndTime: "17:00",
      weekdaySessionPriceKz: 35_000, holidaySessionPriceKz: 60_000,
    },
    "sala-kudi": {
      standardStartTime: "08:00", standardEndTime: "17:00", standardMinimumHours: 1,
      standardHourlyRate: 3_500, standardShortStayHourlyRate: 5_000, standardDiscountFromHours: 6,
      afterHoursStartTime: "17:00", afterHoursEndTime: "20:00", afterHoursPriceKz: 7_500,
      sessionMorningStartTime: "07:00", sessionMorningEndTime: "12:00",
      sessionAfternoonStartTime: "12:30", sessionAfternoonEndTime: "17:00",
      weekdaySessionPriceKz: 35_000, holidaySessionPriceKz: 60_000,
    },
    "sala-ondjango": {
      standardStartTime: "08:00", standardEndTime: "17:00", standardMinimumHours: 1,
      standardHourlyRate: 5_000, standardShortStayHourlyRate: 5_000, standardDiscountFromHours: 6,
      afterHoursStartTime: "17:00", afterHoursEndTime: "20:00", afterHoursPriceKz: 10_500,
      sessionMorningStartTime: "07:00", sessionMorningEndTime: "12:00",
      sessionAfternoonStartTime: "12:30", sessionAfternoonEndTime: "17:00",
      weekdaySessionPriceKz: 35_000, holidaySessionPriceKz: 60_000,
    },
  },
  holidayDates: [],
};

const roomDetails: Omit<Room, "rateDetails">[] = [
  {
    id: "sala-soba",
    name: "Sala Soba",
    capacity: 8,
    description: "Indicada para formações, reuniões, workshops, entrevistas e pequenas atividades profissionais.",
    image: "/images/rooms/sala-soba.jpg",
    facilities: [
      "Janelas amplas com vista privilegiada",
      "Ar-condicionado",
      "Projetor",
      "Quadro branco e flipchart",
      "Apoio técnico e manutenção",
      "Iluminação contemporânea",
      "Cadeiras executivas confortáveis",
    ],
  },
  {
    id: "sala-kilamba",
    name: "Sala Kilamba",
    capacity: 25,
    description: "Sala de formação equipada para aulas, apresentações e atividades de grupo.",
    image: "/images/rooms/sala-kilamba.jpg",
    facilities: [
      "Mesa funcional para o formador",
      "Ar-condicionado",
      "Projetor",
      "Quadro branco e flipchart",
      "Apoio técnico e manutenção",
    ],
  },
  {
    id: "sala-kudi",
    name: "Sala Kudi",
    capacity: 18,
    description: "Indicada para formações, workshops e reuniões de equipas.",
    image: "/images/rooms/sala-kudi.jpg",
    facilities: [
      "Mesa funcional para o formador",
      "Ar-condicionado",
      "Projetor",
      "Quadro branco e flipchart",
      "Internet",
      "Apoio técnico e manutenção",
    ],
  },
  {
    id: "sala-ondjango",
    name: "Sala Ondjango",
    capacity: 64,
    description: "Indicada para formações, conferências, workshops, palestras, seminários e outros eventos.",
    image: "/images/rooms/sala-ondjango.jpg",
    facilities: [
      "Palco e área de destaque",
      "Ar-condicionado",
      "Projetor e quadro branco",
      "Flipchart",
      "Internet",
      "Sistema de som e microfone",
      "Apoio técnico e manutenção",
    ],
  },
];

const roomIds = new Set<RoomId>(roomDetails.map((room) => room.id));
const luandaTimeZone = "Africa/Luanda";

function dateFromCalendarString(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value
    ? null
    : parsed;
}

export function isValidBookingDate(value: string): boolean {
  return dateFromCalendarString(value) !== null;
}

export function luandaCalendarDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: luandaTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isTodayOrFuture(value: string): boolean {
  return isValidBookingDate(value) && value >= luandaCalendarDate();
}

function timeToMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function luandaCurrentMinutes(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: luandaTimeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value ?? 0);
  return part("hour") * 60 + part("minute");
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const value = h + l - 7 * m + 114;
  return new Date(Date.UTC(year, Math.floor(value / 31) - 1, (value % 31) + 1));
}

function shiftDate(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

function holidaysForYear(year: number): string[] {
  const fixedHolidays = [
    `${year}-01-01`, `${year}-02-04`, `${year}-03-08`, `${year}-04-04`,
    `${year}-05-01`, `${year}-09-17`, `${year}-11-02`, `${year}-11-11`, `${year}-12-25`,
  ];
  const easter = easterSunday(year);
  const movableHolidays = [
    toDateKey(shiftDate(easter, -47)),
    toDateKey(shiftDate(easter, -2)),
  ];
  return [...fixedHolidays, ...movableHolidays];
}

for (let year = 2024; year <= 2040; year += 1) {
  defaultRoomBookingSettings.holidayDates.push(...holidaysForYear(year));
}
defaultRoomBookingSettings.holidayDates.sort();

function padTimePart(value: number): string {
  return String(value).padStart(2, "0");
}

function formatMinutes(value: number): string {
  return `${padTimePart(Math.floor(value / 60))}:${padTimePart(value % 60)}`;
}

function makeSlot(
  id: string,
  startMinutes: number,
  durationMinutes: number,
  priceKz: number,
  period: ReservationPeriod,
): RoomSlot {
  return {
    id,
    startTime: formatMinutes(startMinutes),
    endTime: formatMinutes(startMinutes + durationMinutes),
    durationMinutes,
    priceKz,
    period,
  };
}

export function hasRoom(roomId: string): roomId is RoomId {
  return roomIds.has(roomId as RoomId);
}

export function getRoom(roomId: RoomId): Omit<Room, "rateDetails"> {
  return roomDetails.find((room) => room.id === roomId)!;
}

export function hasRoomStaffAccess(metadata: Record<string, unknown>): boolean {
  if (metadata.academyOwner === true) return true;

  const roleList = Array.isArray(metadata.academyRoles)
    ? metadata.academyRoles.filter((role): role is string => typeof role === "string")
    : [];
  const legacyRole = metadata.academyRole;
  const roles = [...roleList, ...(typeof legacyRole === "string" ? [legacyRole] : [])];
  return roles.some((role) => ["room_staff", "academy_admin", "admin"].includes(role));
}

export type RoomStaffReservation = {
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
  cancelledByName: string | null;
  cancelledAt: Date | null;
};

export function filterRoomReservationsForStaff(
  reservations: RoomStaffReservation[],
  roomId: string,
  date: string,
): RoomStaffReservation[] {
  return reservations.filter((reservation) =>
    reservation.roomId === roomId && reservation.bookingDate === date,
  );
}

export function roomStaffReservationResponse(reservation: RoomStaffReservation) {
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
    cancelledBy: reservation.cancelledByName,
    cancelledAt: reservation.cancelledAt,
  };
}

export function filterAvailableRoomSlots<T extends Pick<RoomSlot, "startTime" | "endTime">>(
  slots: T[],
  reservations: Array<Pick<RoomStaffReservation, "status" | "startTime" | "endTime">>,
): T[] {
  const confirmedReservations = reservations.filter((reservation) => reservation.status === "confirmed");
  return slots.filter((slot) =>
    !confirmedReservations.some((reservation) => slotsOverlap(slot, reservation)),
  );
}

function formatRate(value: number): string {
  return new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 0 }).format(value);
}

function displayTime(value: string): string {
  return value.replace(":", "h");
}

export function getRooms(settings: RoomBookingSettings): Room[] {
  return roomDetails.map((room) => {
    const rules = settings.roomRules[room.id];
    const rateDetails = room.id === "sala-ondjango"
      ? [
          `Seg. a sex., ${displayTime(rules.sessionMorningStartTime)}–${displayTime(rules.sessionMorningEndTime)} ou ${displayTime(rules.sessionAfternoonStartTime)}–${displayTime(rules.sessionAfternoonEndTime)}: ${formatRate(rules.weekdaySessionPriceKz)} Kz por sessão.`,
          `Fins de semana e feriados, nos mesmos horários: ${formatRate(rules.holidaySessionPriceKz)} Kz por sessão.`,
        ]
      : [
          `Seg. a sex., ${displayTime(rules.standardStartTime)}–${displayTime(rules.standardEndTime)}: ${formatRate(rules.standardHourlyRate)} Kz/h (mínimo de ${rules.standardMinimumHours} ${rules.standardMinimumHours === 1 ? "hora" : "horas"}).`,
          ...(room.id === "sala-kudi"
            ? [`Reservas inferiores a ${rules.standardDiscountFromHours} horas: ${formatRate(rules.standardShortStayHourlyRate)} Kz/h.`]
            : []),
          `Pós-laboral, seg. a sex., ${displayTime(rules.afterHoursStartTime)}–${displayTime(rules.afterHoursEndTime)}: ${formatRate(rules.afterHoursPriceKz)} Kz por sessão.`,
        ];
    return { ...room, rateDetails };
  });
}

export function isValidRoomPeriod(
  roomId: RoomId,
  period: ReservationPeriod,
  durationHours?: number,
  settings: RoomBookingSettings = defaultRoomBookingSettings,
): boolean {
  if (roomId === "sala-ondjango") return period === "session";
  if (period === "session") return false;
  if (period === "after_hours") {
    const rules = settings.roomRules[roomId];
    return timeToMinutes(rules.afterHoursStartTime) < timeToMinutes(rules.afterHoursEndTime);
  }
  if (!Number.isInteger(durationHours) || durationHours === undefined) return false;
  if (durationHours < 1 || durationHours > 9) return false;
  const rules = settings.roomRules[roomId];
  return durationHours >= rules.standardMinimumHours
    && timeToMinutes(rules.standardStartTime) < timeToMinutes(rules.standardEndTime);
}

export function buildRoomSlots(
  roomId: RoomId,
  bookingDate: string,
  period: ReservationPeriod,
  durationHours?: number,
  settings: RoomBookingSettings = defaultRoomBookingSettings,
): RoomSlot[] {
  const date = dateFromCalendarString(bookingDate);
  if (!date || !isTodayOrFuture(bookingDate) || !isValidRoomPeriod(roomId, period, durationHours, settings)) {
    return [];
  }

  const dayOfWeek = date.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = settings.holidayDates.includes(bookingDate);
  const rules = settings.roomRules[roomId];

  if (roomId === "sala-ondjango") {
    if (period !== "session") return [];
    const price = isWeekend || isHoliday ? rules.holidaySessionPriceKz : rules.weekdaySessionPriceKz;
    return [
      makeSlot(`ondjango-morning-${rules.sessionMorningStartTime}-${rules.sessionMorningEndTime}-${price}`, timeToMinutes(rules.sessionMorningStartTime), timeToMinutes(rules.sessionMorningEndTime) - timeToMinutes(rules.sessionMorningStartTime), price, "session"),
      makeSlot(`ondjango-afternoon-${rules.sessionAfternoonStartTime}-${rules.sessionAfternoonEndTime}-${price}`, timeToMinutes(rules.sessionAfternoonStartTime), timeToMinutes(rules.sessionAfternoonEndTime) - timeToMinutes(rules.sessionAfternoonStartTime), price, "session"),
    ];
  }

  if (isWeekend || isHoliday) return [];
  if (period === "after_hours") {
    const start = timeToMinutes(rules.afterHoursStartTime);
    const end = timeToMinutes(rules.afterHoursEndTime);
    return [makeSlot(`${roomId}-after-hours-${rules.afterHoursStartTime}-${rules.afterHoursEndTime}-${rules.afterHoursPriceKz}`, start, end - start, rules.afterHoursPriceKz, "after_hours")];
  }

  if (period !== "standard" || durationHours === undefined) return [];
  const hourlyRate = roomId === "sala-kudi" && durationHours < rules.standardDiscountFromHours
    ? rules.standardShortStayHourlyRate
    : rules.standardHourlyRate;
  const priceKz = hourlyRate * durationHours;
  const durationMinutes = durationHours * 60;
  const dayStart = timeToMinutes(rules.standardStartTime);
  const dayEnd = timeToMinutes(rules.standardEndTime);
  const slots: RoomSlot[] = [];

  for (let start = dayStart; start + durationMinutes <= dayEnd; start += 60) {
    slots.push(makeSlot(`${roomId}-standard-${formatMinutes(start)}-${durationHours}h-${priceKz}`, start, durationMinutes, priceKz, "standard"));
  }

  return slots;
}

export function slotHasStarted(bookingDate: string, slot: RoomSlot, now = new Date()): boolean {
  if (bookingDate > luandaCalendarDate(now)) return false;
  if (bookingDate < luandaCalendarDate(now)) return true;
  return timeToMinutes(slot.startTime) <= luandaCurrentMinutes(now);
}

export function slotsOverlap(
  slot: Pick<RoomSlot, "startTime" | "endTime">,
  booked: { startTime: string; endTime: string },
): boolean {
  return timeToMinutes(slot.startTime) < timeToMinutes(booked.endTime)
    && timeToMinutes(slot.endTime) > timeToMinutes(booked.startTime);
}
