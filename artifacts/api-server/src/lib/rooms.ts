import type { ReservationPeriod, Room, RoomId, RoomSlot } from "@workspace/api-zod";

export const rooms: Room[] = [
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
    rateDetails: [
      "Seg. a sex., 08h00–17h00: 5.000 Kz/h (mínimo de 6 horas).",
      "Pós-laboral, seg. a sex., 17h00–20h00: 10.500 Kz por 3 horas.",
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
    rateDetails: [
      "Seg. a sex., 08h00–17h00: 4.500 Kz/h (mínimo de 6 horas).",
      "Pós-laboral, seg. a sex., 17h00–20h00: 10.500 Kz por 3 horas.",
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
    rateDetails: [
      "Seg. a sex., 08h00–17h00: 3.500 Kz/h a partir de 6 horas.",
      "Reservas inferiores a 6 horas: 5.000 Kz/h.",
      "Pós-laboral, seg. a sex., 17h00–20h00: 7.500 Kz por 3 horas.",
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
    rateDetails: [
      "Seg. a sex., 07h00–12h00 ou 12h30–17h00: 35.000 Kz por sessão.",
      "Fins de semana e feriados, nos mesmos horários: 60.000 Kz por sessão.",
    ],
  },
];

const roomIds = new Set<RoomId>(rooms.map((room) => room.id));
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

function isAngolaPublicHoliday(value: string, date: Date): boolean {
  const fixedHolidays = new Set([
    `${date.getUTCFullYear()}-01-01`,
    `${date.getUTCFullYear()}-02-04`,
    `${date.getUTCFullYear()}-03-08`,
    `${date.getUTCFullYear()}-04-04`,
    `${date.getUTCFullYear()}-05-01`,
    `${date.getUTCFullYear()}-09-17`,
    `${date.getUTCFullYear()}-11-02`,
    `${date.getUTCFullYear()}-11-11`,
    `${date.getUTCFullYear()}-12-25`,
  ]);
  const easter = easterSunday(date.getUTCFullYear());
  const movableHolidays = new Set([
    toDateKey(shiftDate(easter, -47)),
    toDateKey(shiftDate(easter, -2)),
  ]);
  return fixedHolidays.has(value) || movableHolidays.has(value);
}

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

export function getRoom(roomId: RoomId): Room {
  return rooms.find((room) => room.id === roomId)!;
}

export function isValidRoomPeriod(
  roomId: RoomId,
  period: ReservationPeriod,
  durationHours?: number,
): boolean {
  if (roomId === "sala-ondjango") return period === "session";
  if (period === "session") return false;
  if (period === "after_hours") return true;
  if (!Number.isInteger(durationHours) || durationHours === undefined) return false;
  if (durationHours < 1 || durationHours > 9) return false;
  if (roomId === "sala-kudi") return true;
  return durationHours >= 6;
}

export function buildRoomSlots(
  roomId: RoomId,
  bookingDate: string,
  period: ReservationPeriod,
  durationHours?: number,
): RoomSlot[] {
  const date = dateFromCalendarString(bookingDate);
  if (!date || !isTodayOrFuture(bookingDate) || !isValidRoomPeriod(roomId, period, durationHours)) {
    return [];
  }

  const dayOfWeek = date.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = isAngolaPublicHoliday(bookingDate, date);

  if (roomId === "sala-ondjango") {
    if (period !== "session") return [];
    const price = isWeekend || isHoliday ? 60_000 : 35_000;
    return [
      makeSlot("ondjango-morning", 7 * 60, 5 * 60, price, "session"),
      makeSlot("ondjango-afternoon", 12 * 60 + 30, 4 * 60 + 30, price, "session"),
    ];
  }

  if (isWeekend || isHoliday) return [];
  if (period === "after_hours") {
    const priceByRoom: Record<Exclude<RoomId, "sala-ondjango">, number> = {
      "sala-soba": 10_500,
      "sala-kilamba": 10_500,
      "sala-kudi": 7_500,
    };
    return [makeSlot(`${roomId}-after-hours`, 17 * 60, 3 * 60, priceByRoom[roomId], "after_hours")];
  }

  if (period !== "standard" || durationHours === undefined) return [];
  const hourlyRate = roomId === "sala-soba" ? 5_000 : roomId === "sala-kilamba" ? 4_500 : 0;
  const kudiHourlyRate = durationHours >= 6 ? 3_500 : 5_000;
  const priceKz = (roomId === "sala-kudi" ? kudiHourlyRate : hourlyRate) * durationHours;
  const durationMinutes = durationHours * 60;
  const dayEnd = 17 * 60;
  const slots: RoomSlot[] = [];

  for (let start = 8 * 60; start + durationMinutes <= dayEnd; start += 60) {
    slots.push(makeSlot(`${roomId}-standard-${formatMinutes(start)}-${durationHours}h`, start, durationMinutes, priceKz, "standard"));
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
