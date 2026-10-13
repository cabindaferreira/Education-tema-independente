import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const academyCoursesTable = pgTable("academy_courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: text("duration").notNull(),
  priceKz: integer("price_kz").notNull(),
  imageUrl: text("image_url").notNull(),
  published: boolean("published").notNull().default(false),
  enrollmentOpen: boolean("enrollment_open").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export type AcademyCourseRecord = typeof academyCoursesTable.$inferSelect;
