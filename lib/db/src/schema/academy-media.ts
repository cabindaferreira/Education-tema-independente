import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const academyMediaTable = pgTable(
  "academy_media",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    altText: text("alt_text").notNull().default(""),
    objectPath: text("object_path").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("academy_media_object_path_idx").on(table.objectPath)],
);

export type AcademyMediaRecord = typeof academyMediaTable.$inferSelect;
