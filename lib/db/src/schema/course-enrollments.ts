import {
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const courseEnrollmentsTable = pgTable(
  "course_enrollments",
  {
    id: uuid("id").primaryKey(),
    courseId: text("course_id").notNull(),
    courseTitle: text("course_title").notNull(),
    fullName: text("full_name").notNull(),
    birthDate: date("birth_date", { mode: "string" }).notNull(),
    identityNumber: text("identity_number").notNull(),
    nationality: text("nationality").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    address: text("address").notNull(),
    municipality: text("municipality").notNull(),
    province: text("province").notNull(),
    profession: text("profession").notNull(),
    maritalStatus: text("marital_status").notNull(),
    privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }).notNull(),
    amountKz: integer("amount_kz").notNull(),
    paymentEntity: text("payment_entity").notNull(),
    paymentReference: text("payment_reference").notNull(),
    paymentStatus: text("payment_status").notNull().default("pending"),
    paymentReferenceRenewalRequestedAt: timestamp("payment_reference_renewal_requested_at", { withTimezone: true }),
    paymentTransactionId: text("payment_transaction_id"),
    paymentAmountKz: integer("payment_amount_kz"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    confirmationEmailStatus: text("confirmation_email_status").notNull().default("pending"),
    confirmationEmailSentAt: timestamp("confirmation_email_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("course_enrollments_payment_reference_uq").on(table.paymentReference),
    uniqueIndex("course_enrollments_payment_transaction_uq").on(table.paymentTransactionId),
    index("course_enrollments_email_created_idx").on(table.email, table.createdAt),
  ],
);

export type CourseEnrollmentRecord = typeof courseEnrollmentsTable.$inferSelect;
export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollmentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;

export const courseEnrollmentActionsTable = pgTable(
  "course_enrollment_actions",
  {
    id: serial("id").primaryKey(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => courseEnrollmentsTable.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").notNull(),
    actionType: text("action_type").notNull(),
    paymentStatus: text("payment_status"),
    confirmationEmailStatus: text("confirmation_email_status"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("course_enrollment_actions_enrollment_created_idx").on(table.enrollmentId, table.createdAt),
  ],
);

export type CourseEnrollmentAction = typeof courseEnrollmentActionsTable.$inferSelect;
