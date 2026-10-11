import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const newsletterSignupsTable = pgTable("newsletter_signups", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  confirmationSentAt: timestamp("confirmation_sent_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type NewsletterSignup = typeof newsletterSignupsTable.$inferSelect;
