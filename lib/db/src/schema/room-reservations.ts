import {
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  time,
  timestamp,
} from "drizzle-orm/pg-core";

export const roomReservationsTable = pgTable(
  "room_reservations",
  {
    id: serial("id").primaryKey(),
    roomId: text("room_id").notNull(),
    bookingDate: date("booking_date", { mode: "string" }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    priceKz: integer("price_kz").notNull(),
    name: text("name").notNull(),
    company: text("company"),
    nif: text("nif").notNull(),
    status: text("status").notNull().default("confirmed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("room_reservations_room_date_idx").on(table.roomId, table.bookingDate)],
);

export type RoomReservationRecord = typeof roomReservationsTable.$inferSelect;
