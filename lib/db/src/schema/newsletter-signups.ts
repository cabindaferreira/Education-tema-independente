import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const newsletterSignupsTable = pgTable("newsletter_signups", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  unsubscribeTokenHash: varchar("unsubscribe_token_hash", { length: 64 }),
  revokedUnsubscribeTokenHash: varchar("revoked_unsubscribe_token_hash", {
    length: 64,
  }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  confirmationSentAt: timestamp("confirmation_sent_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type NewsletterSignup = typeof newsletterSignupsTable.$inferSelect;
