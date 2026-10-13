import { date, index, pgTable, serial, text, time, timestamp } from "drizzle-orm/pg-core";

export const roomAvailabilityBlocksTable = pgTable(
  "room_availability_blocks",
  {
    id: serial("id").primaryKey(),
    roomId: text("room_id").notNull(),
    bookingDate: date("booking_date", { mode: "string" }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    reason: text("reason").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    releasedBy: text("released_by"),
    releasedAt: timestamp("released_at", { withTimezone: true }),
  },
  (table) => [index("room_availability_blocks_room_date_idx").on(table.roomId, table.bookingDate)],
);

export type RoomAvailabilityBlockRecord = typeof roomAvailabilityBlocksTable.$inferSelect;
