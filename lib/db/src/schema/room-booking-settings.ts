import { integer, jsonb, pgTable } from "drizzle-orm/pg-core";

export type StoredRoomBookingSettings = {
  roomRules: Record<string, Record<string, number | string>>;
  holidayDates: string[];
};

export const roomBookingSettingsTable = pgTable("room_booking_settings", {
  id: integer("id").primaryKey(),
  settings: jsonb("settings").$type<StoredRoomBookingSettings>().notNull(),
});
