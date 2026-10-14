import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { and, desc, eq, ilike, inArray, isNull, lt, or } from "drizzle-orm";
import { Router, type IRouter, type Request } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import {
  CreateCourseEnrollmentBody,
  CreateCourseEnrollmentResponse,
  GetCourseEnrollmentStatusParams,
  GetCourseEnrollmentStatusResponse,
  ListStaffCourseEnrollmentsQueryParams,
  ListStaffCourseEnrollmentsResponse,
  ReceiveProxyPayPaymentBody,
  RenewCourseEnrollmentReferenceParams,
  RenewCourseEnrollmentReferenceResponse,
  ResolveStaffCourseEnrollmentBody,
  ResolveStaffCourseEnrollmentParams,
  ResolveStaffCourseEnrollmentResponse,
  RetryStaffCourseEnrollmentConfirmationParams,
  RetryStaffCourseEnrollmentConfirmationResponse,
} from "@workspace/api-zod";
import { academyCoursesTable, db, courseEnrollmentActionsTable, courseEnrollmentsTable } from "@workspace/db";
import { ensureDefaultAcademyCourses } from "../lib/course-catalog-db";
import { sendCoursePaymentConfirmation } from "../lib/course-payment-email";

const router: IRouter = Router();
const PROXYPAY_API_URL = "https://api.proxypay.co.ao";
const PROXYPAY_ENTITY = "00413";
const WEBHOOK_URL = "https://education-tema-independente.replit.app/api/proxypay/webhook";
const REFERENCE_VALIDITY_HOURS = 72;

const REFERENCE_RENEWAL_COOLDOWN_MS = 2 * 60 * 1000;
async function requireCourseStaff(
  req: Parameters<typeof getAuth>[0],
  res: import("express").Response,
): Promise<string | null> {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Inicie sessão para continuar." });
    return null;
  }

  const user = await clerkClient.users.getUser(userId);
  const metadata = user.privateMetadata as Record<string, unknown>;
  const academyRoles = Array.isArray(metadata.academyRoles)
    ? metadata.academyRoles.filter((role): role is string => typeof role === "string")
    : [];
  const legacyRole = metadata.academyRole;
  if (
    !academyRoles.some((role) => ["room_staff", "course_staff", "admin", "academy_admin"].includes(role))
    && !["room_staff", "course_staff", "admin", "academy_admin"].includes(String(legacyRole))
  ) {
    res.status(403).json({ error: "Esta área está reservada à equipa autorizada da Academia." });
    return null;
  }

  return userId;
}

function staffEnrollmentResponse(
  enrollment: typeof courseEnrollmentsTable.$inferSelect,
  actions: (typeof courseEnrollmentActionsTable.$inferSelect)[],
) {
  return {
    id: enrollment.id,
    courseId: enrollment.courseId,
    courseTitle: enrollment.courseTitle,
    fullName: enrollment.fullName,
    birthDate: enrollment.birthDate,
    identityNumber: enrollment.identityNumber,
    nationality: enrollment.nationality,
    phone: enrollment.phone,
    email: enrollment.email,
    address: enrollment.address,
    municipality: enrollment.municipality,
    province: enrollment.province,
    profession: enrollment.profession,
    maritalStatus: enrollment.maritalStatus,
    amountKz: enrollment.amountKz,
    paymentEntity: enrollment.paymentEntity,
    paymentReference: enrollment.paymentReference,
    paymentStatus: enrollment.paymentStatus,
    paymentTransactionId: enrollment.paymentTransactionId,
    paymentAmountKz: enrollment.paymentAmountKz,
    paidAt: enrollment.paidAt,
    expiresAt: enrollment.expiresAt,
    confirmationEmailStatus: enrollment.confirmationEmailStatus,
    confirmationEmailSentAt: enrollment.confirmationEmailSentAt,
    actions: actions.map((action) => ({
      id: action.id,
      actorUserId: action.actorUserId,
      actionType: action.actionType,
      paymentStatus: action.paymentStatus,
      confirmationEmailStatus: action.confirmationEmailStatus,
      note: action.note,
      createdAt: action.createdAt,
    })),
  };
}

async function loadStaffEnrollment(enrollmentId: string) {
  const [enrollment] = await db
    .select()
    .from(courseEnrollmentsTable)
    .where(eq(courseEnrollmentsTable.id, enrollmentId))
    .limit(1);
  if (!enrollment) return null;

  const actions = await db
    .select()
    .from(courseEnrollmentActionsTable)
    .where(eq(courseEnrollmentActionsTable.enrollmentId, enrollmentId))
    .orderBy(courseEnrollmentActionsTable.createdAt, courseEnrollmentActionsTable.id);
  return staffEnrollmentResponse(enrollment, actions);
}

class ProxyPayNotConfiguredError extends Error {}

class ProxyPayRequestError extends Error {
  constructor(readonly status: number) {
    super(`ProxyPay returned HTTP ${status}`);
  }
}

function getProxyPayKey(): string {
  const key = process.env.PROXYPAY_API_KEY;
  if (!key) {
    throw new ProxyPayNotConfiguredError("ProxyPay API key is not configured.");
  }
  return key;
}

async function proxyPayRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const key = getProxyPayKey();
  const response = await fetch(`${PROXYPAY_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${key}`,
      Accept: "application/vnd.proxypay.v2+json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(12_000),
  });
  return response;
}

async function createProxyPayReference(amountKz: number, enrollmentId: string, courseId: string, expiresAt: Date): Promise<string> {
  const idResponse = await proxyPayRequest("/reference_ids", { method: "POST" });
  if (!idResponse.ok) {
    throw new ProxyPayRequestError(idResponse.status);
  }

  const rawReference = await idResponse.text();
  let parsedReference: unknown;
  try {
    parsedReference = JSON.parse(rawReference);
  } catch {
    throw new Error("ProxyPay returned an invalid reference ID.");
  }

  const referenceValue =
    typeof parsedReference === "number"
      ? String(parsedReference)
      : typeof parsedReference === "object" && parsedReference !== null && "id" in parsedReference
        ? String((parsedReference as { id: unknown }).id)
        : "";

  if (!/^\d{6,12}$/.test(referenceValue)) {
    throw new Error("ProxyPay returned an invalid reference ID.");
  }

  const referenceResponse = await proxyPayRequest(`/references/${referenceValue}`, {
    method: "PUT",
    body: JSON.stringify({
      amount: amountKz.toFixed(2),
      end_datetime: expiresAt.toISOString(),
      custom_fields: {
        enrollment_id: enrollmentId,
        course_id: courseId,
        callback_url: WEBHOOK_URL,
      },
    }),
  });

  if (!referenceResponse.ok) {
    try {
      await proxyPayRequest(`/references/${referenceValue}`, { method: "DELETE" });
    } catch {
      // The provider will expire the reference; do not hide the original failure.
    }
    throw new ProxyPayRequestError(referenceResponse.status);
  }

  return referenceValue;
}

function checkoutResponse(enrollment: {
  id: string;
  courseId: string;
  courseTitle: string;
  amountKz: number;
  paymentEntity: string;
  paymentReference: string;
  paymentStatus: string;
  expiresAt: Date;
}) {
  return {
    id: enrollment.id,
    courseId: enrollment.courseId,
    courseTitle: enrollment.courseTitle,
    amountKz: enrollment.amountKz,
    paymentEntity: enrollment.paymentEntity,
    paymentReference: enrollment.paymentReference,
    paymentStatus: enrollment.paymentStatus as "pending" | "paid" | "review_required" | "expired",
    expiresAt: enrollment.expiresAt.toISOString(),
  };
}

router.post("/course-enrollments", async (req, res): Promise<void> => {
  const candidate = req.body && typeof req.body === "object"
    ? {
        ...req.body,
        email: typeof req.body.email === "string" ? req.body.email.trim() : req.body.email,
      }
    : req.body;
  const submittedBirthDate =
    candidate && typeof candidate === "object" && typeof candidate.birthDate === "string"
      ? candidate.birthDate
      : "";
  const submittedBirthDateTimestamp = new Date(`${submittedBirthDate}T00:00:00Z`).getTime();
  const isValidBirthDate =
    /^\d{4}-\d{2}-\d{2}$/.test(submittedBirthDate)
    && !Number.isNaN(submittedBirthDateTimestamp)
    && new Date(submittedBirthDateTimestamp).toISOString().slice(0, 10) === submittedBirthDate;
  if (!isValidBirthDate) {
    res.status(400).json({ error: "Indique uma data de nascimento válida." });
    return;
  }

  const parsed = CreateCourseEnrollmentBody.safeParse(candidate);
  if (!parsed.success) {
    res.status(400).json({ error: "Preencha todos os dados da ficha de inscrição." });
    return;
  }

  const input = parsed.data;
  await ensureDefaultAcademyCourses();
  const [course] = await db
    .select()
    .from(academyCoursesTable)
    .where(and(
      eq(academyCoursesTable.id, input.courseId),
      eq(academyCoursesTable.published, true),
      eq(academyCoursesTable.enrollmentOpen, true),
      isNull(academyCoursesTable.archivedAt),
    ))
    .limit(1);
  if (!course) {
    res.status(404).json({ error: "Este curso não está disponível para inscrição." });
    return;
  }
  const fullName = input.fullName.trim();
  const identityNumber = input.identityNumber.trim();
  const birthDate = submittedBirthDate;
  const birthDateTimestamp = submittedBirthDateTimestamp;
  if (
    fullName.length < 2
    || identityNumber.length < 3
    || Number.isNaN(birthDateTimestamp)
    || birthDateTimestamp > Date.now()
  ) {
    res.status(400).json({ error: "Verifique o nome, o documento de identificação e a data de nascimento." });
    return;
  }

  const id = randomUUID();
  const expiresAt = new Date(Date.now() + REFERENCE_VALIDITY_HOURS * 60 * 60 * 1000);
  let paymentReference: string | undefined;

  try {
    paymentReference = await createProxyPayReference(course.priceKz, id, input.courseId, expiresAt);
    const [enrollment] = await db
      .insert(courseEnrollmentsTable)
      .values({
        id,
        courseId: input.courseId,
        courseTitle: course.title,
        fullName,
        birthDate,
        identityNumber,
        nationality: input.nationality.trim(),
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        address: input.address.trim(),
        municipality: input.municipality.trim(),
        province: input.province.trim(),
        profession: input.profession.trim(),
        maritalStatus: input.maritalStatus.trim(),
        privacyAcceptedAt: new Date(),
        amountKz: course.priceKz,
        paymentEntity: PROXYPAY_ENTITY,
        paymentReference,
        paymentStatus: "pending",
        expiresAt,
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(CreateCourseEnrollmentResponse.parse(checkoutResponse(enrollment)));
  } catch (error) {
    if (paymentReference) {
      try {
        await proxyPayRequest(`/references/${paymentReference}`, { method: "DELETE" });
      } catch {
        // Cleanup is best-effort; the saved enrollment and original error remain authoritative.
      }
    }

    if (error instanceof ProxyPayNotConfiguredError) {
      res.status(503).json({ error: "O serviço de pagamentos não está configurado." });
      return;
    }

    const status = error instanceof ProxyPayRequestError ? error.status : undefined;
    req.log.error({ providerStatus: status }, "Course checkout reference creation failed");
    res.status(502).json({ error: "Não foi possível gerar a referência agora. Tente novamente." });
  }
});

router.get("/course-enrollments/staff", async (req, res): Promise<void> => {
  if (!(await requireCourseStaff(req, res))) return;

  const parsed = ListStaffCourseEnrollmentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Os filtros de pesquisa não são válidos." });
    return;
  }

  await db
    .update(courseEnrollmentsTable)
    .set({ paymentStatus: "expired", updatedAt: new Date() })
    .where(and(
      eq(courseEnrollmentsTable.paymentStatus, "pending"),
      lt(courseEnrollmentsTable.expiresAt, new Date()),
    ));

  const filters = [];
  if (parsed.data.courseId) filters.push(eq(courseEnrollmentsTable.courseId, parsed.data.courseId));
  if (parsed.data.paymentStatus) filters.push(eq(courseEnrollmentsTable.paymentStatus, parsed.data.paymentStatus));
  const search = parsed.data.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    filters.push(or(
      ilike(courseEnrollmentsTable.fullName, pattern),
      ilike(courseEnrollmentsTable.email, pattern),
      ilike(courseEnrollmentsTable.identityNumber, pattern),
      ilike(courseEnrollmentsTable.paymentReference, pattern),
      ilike(courseEnrollmentsTable.phone, pattern),
    )!);
  }

  const enrollments = await db
    .select()
    .from(courseEnrollmentsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(courseEnrollmentsTable.createdAt))
    .limit(200);
  const recentEnrollments = enrollments;
  const enrollmentIds = recentEnrollments.map((enrollment) => enrollment.id);
  const actions = enrollmentIds.length
    ? await db
        .select()
        .from(courseEnrollmentActionsTable)
        .where(inArray(courseEnrollmentActionsTable.enrollmentId, enrollmentIds))
        .orderBy(courseEnrollmentActionsTable.createdAt, courseEnrollmentActionsTable.id)
    : [];
  const actionsByEnrollment = new Map<string, typeof actions>();
  for (const action of actions) {
    const current = actionsByEnrollment.get(action.enrollmentId) ?? [];
    current.push(action);
    actionsByEnrollment.set(action.enrollmentId, current);
  }

  res.json(ListStaffCourseEnrollmentsResponse.parse(
    recentEnrollments.map((enrollment) =>
      staffEnrollmentResponse(enrollment, actionsByEnrollment.get(enrollment.id) ?? []),
    ),
  ));
});

router.post("/course-enrollments/:id/resolve", async (req, res): Promise<void> => {
  const actorUserId = await requireCourseStaff(req, res);
  if (!actorUserId) return;

  const params = ResolveStaffCourseEnrollmentParams.safeParse(req.params);
  const body = ResolveStaffCourseEnrollmentBody.safeParse(req.body);
  if (!params.success || !body.success || body.data.note.trim().length < 5) {
    res.status(400).json({ error: "Indique uma decisão e uma justificação válida." });
    return;
  }

  const nextPaymentStatus = body.data.decision === "confirm_payment" ? "paid" : "expired";
  const transaction = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(courseEnrollmentsTable)
      .set({
        paymentStatus: nextPaymentStatus,
        ...(nextPaymentStatus === "paid" ? { paidAt: new Date(), confirmationEmailStatus: "sending" } : {}),
        updatedAt: new Date(),
      })
      .where(and(
        eq(courseEnrollmentsTable.id, params.data.id),
        eq(courseEnrollmentsTable.paymentStatus, "review_required"),
      ))
      .returning();
    if (!updated) return null;

    const [action] = await tx
      .insert(courseEnrollmentActionsTable)
      .values({
        enrollmentId: updated.id,
        actorUserId,
        actionType: "payment_resolved",
        paymentStatus: nextPaymentStatus,
        confirmationEmailStatus: updated.confirmationEmailStatus,
        note: body.data.note.trim(),
      })
      .returning();
    return { enrollment: updated, action };
  });

  if (!transaction) {
    const [existing] = await db
      .select({ id: courseEnrollmentsTable.id })
      .from(courseEnrollmentsTable)
      .where(eq(courseEnrollmentsTable.id, params.data.id))
      .limit(1);
    res.status(existing ? 409 : 404).json({
      error: existing ? "Esta exceção já foi resolvida por outra pessoa." : "Inscrição não encontrada.",
    });
    return;
  }

  if (nextPaymentStatus === "paid") {
    try {
      await sendCoursePaymentConfirmation({
        enrollmentId: transaction.enrollment.id,
        name: transaction.enrollment.fullName,
        email: transaction.enrollment.email,
        courseTitle: transaction.enrollment.courseTitle,
        amountKz: transaction.enrollment.amountKz,
        paymentReference: transaction.enrollment.paymentReference,
        idempotencyKey: `course-payment-confirmation-${transaction.enrollment.id}-resolution-${transaction.action.id}`,
      });
      await db.transaction(async (tx) => {
        await tx
          .update(courseEnrollmentsTable)
          .set({ confirmationEmailStatus: "sent", confirmationEmailSentAt: new Date(), updatedAt: new Date() })
          .where(eq(courseEnrollmentsTable.id, transaction.enrollment.id));
        await tx
          .update(courseEnrollmentActionsTable)
          .set({ confirmationEmailStatus: "sent" })
          .where(eq(courseEnrollmentActionsTable.id, transaction.action.id));
      });
    } catch (error) {
      await db.transaction(async (tx) => {
        await tx
          .update(courseEnrollmentsTable)
          .set({ confirmationEmailStatus: "failed", updatedAt: new Date() })
          .where(eq(courseEnrollmentsTable.id, transaction.enrollment.id));
        await tx
          .update(courseEnrollmentActionsTable)
          .set({ confirmationEmailStatus: "failed" })
          .where(eq(courseEnrollmentActionsTable.id, transaction.action.id));
      });
      req.log.error(
        { enrollmentId: transaction.enrollment.id, errorName: error instanceof Error ? error.name : "UnknownError" },
        "Payment review was resolved, but the confirmation email failed",
      );
    }
  }

  const response = await loadStaffEnrollment(transaction.enrollment.id);
  if (!response) {
    res.status(500).json({ error: "A inscrição foi actualizada, mas não foi possível recarregá-la." });
    return;
  }
  res.json(ResolveStaffCourseEnrollmentResponse.parse(response));
});

router.post("/course-enrollments/:id/retry-confirmation", async (req, res): Promise<void> => {
  const actorUserId = await requireCourseStaff(req, res);
  if (!actorUserId) return;

  const params = RetryStaffCourseEnrollmentConfirmationParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Inscrição não encontrada." });
    return;
  }

  const claimed = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(courseEnrollmentsTable)
      .set({ confirmationEmailStatus: "sending", updatedAt: new Date() })
      .where(and(
        eq(courseEnrollmentsTable.id, params.data.id),
        eq(courseEnrollmentsTable.paymentStatus, "paid"),
        eq(courseEnrollmentsTable.confirmationEmailStatus, "failed"),
      ))
      .returning();
    if (!updated) return null;

    const [action] = await tx
      .insert(courseEnrollmentActionsTable)
      .values({
        enrollmentId: updated.id,
        actorUserId,
        actionType: "confirmation_retry",
        paymentStatus: updated.paymentStatus,
        confirmationEmailStatus: "sending",
        note: "Reenvio manual solicitado pela equipa.",
      })
      .returning();
    return { enrollment: updated, action };
  });

  if (!claimed) {
    const [existing] = await db
      .select({
        id: courseEnrollmentsTable.id,
        paymentStatus: courseEnrollmentsTable.paymentStatus,
      })
      .from(courseEnrollmentsTable)
      .where(eq(courseEnrollmentsTable.id, params.data.id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Inscrição não encontrada." });
      return;
    }
    res.status(409).json({
      error: existing.paymentStatus === "paid"
        ? "A confirmação desta inscrição não está pendente de reenvio."
        : "Só é possível reenviar uma confirmação após o pagamento.",
    });
    return;
  }

  try {
    await sendCoursePaymentConfirmation({
      enrollmentId: claimed.enrollment.id,
      name: claimed.enrollment.fullName,
      email: claimed.enrollment.email,
      courseTitle: claimed.enrollment.courseTitle,
      amountKz: claimed.enrollment.amountKz,
      paymentReference: claimed.enrollment.paymentReference,
      idempotencyKey: `course-payment-confirmation-${claimed.enrollment.id}-retry-${claimed.action.id}`,
    });
    await db.transaction(async (tx) => {
      await tx
        .update(courseEnrollmentsTable)
        .set({ confirmationEmailStatus: "sent", confirmationEmailSentAt: new Date(), updatedAt: new Date() })
        .where(eq(courseEnrollmentsTable.id, claimed.enrollment.id));
      await tx
        .update(courseEnrollmentActionsTable)
        .set({ confirmationEmailStatus: "sent" })
        .where(eq(courseEnrollmentActionsTable.id, claimed.action.id));
    });
  } catch (error) {
    await db.transaction(async (tx) => {
      await tx
        .update(courseEnrollmentsTable)
        .set({ confirmationEmailStatus: "failed", updatedAt: new Date() })
        .where(eq(courseEnrollmentsTable.id, claimed.enrollment.id));
      await tx
        .update(courseEnrollmentActionsTable)
        .set({ confirmationEmailStatus: "failed" })
        .where(eq(courseEnrollmentActionsTable.id, claimed.action.id));
    });
    req.log.error(
      { enrollmentId: claimed.enrollment.id, errorName: error instanceof Error ? error.name : "UnknownError" },
      "Staff course payment confirmation retry failed",
    );
    res.status(502).json({ error: "O reenvio falhou e ficou registado. Pode tentar novamente mais tarde." });
    return;
  }

  const response = await loadStaffEnrollment(claimed.enrollment.id);
  if (!response) {
    res.status(500).json({ error: "O e-mail foi enviado, mas não foi possível recarregar a inscrição." });
    return;
  }
  res.json(RetryStaffCourseEnrollmentConfirmationResponse.parse(response));
});

router.get("/course-enrollments/:id", async (req, res): Promise<void> => {
  const params = GetCourseEnrollmentStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Inscrição não encontrada." });
    return;
  }

  const [enrollment] = await db
    .select()
    .from(courseEnrollmentsTable)
    .where(eq(courseEnrollmentsTable.id, params.data.id))
    .limit(1);

  if (!enrollment) {
    res.status(404).json({ error: "Inscrição não encontrada." });
    return;
  }

  if (enrollment.paymentStatus === "pending" && enrollment.expiresAt.getTime() < Date.now()) {
    await db
      .update(courseEnrollmentsTable)
      .set({ paymentStatus: "expired", updatedAt: new Date() })
      .where(and(
        eq(courseEnrollmentsTable.id, enrollment.id),
        eq(courseEnrollmentsTable.paymentStatus, "pending"),
      ));
    enrollment.paymentStatus = "expired";
  }

  res.json(GetCourseEnrollmentStatusResponse.parse({
    ...checkoutResponse(enrollment),
    confirmationEmailStatus: enrollment.confirmationEmailStatus === "sent" ? "sent" : "pending",
    paidAt: enrollment.paidAt?.toISOString() ?? null,
  }));
});

router.post("/course-enrollments/:id/renew-reference", async (req, res): Promise<void> => {
  const params = RenewCourseEnrollmentReferenceParams.safeParse(req.params);
  if (!params.success) {
    res.status(404).json({ error: "Inscrição não encontrada." });
    return;
  }

  const [initial] = await db
    .select()
    .from(courseEnrollmentsTable)
    .where(eq(courseEnrollmentsTable.id, params.data.id))
    .limit(1);
  if (!initial) {
    res.status(404).json({ error: "Inscrição não encontrada." });
    return;
  }

  const now = new Date();
  if (initial.paymentStatus === "pending" && initial.expiresAt.getTime() < now.getTime()) {
    await db
      .update(courseEnrollmentsTable)
      .set({ paymentStatus: "expired", updatedAt: now })
      .where(and(
        eq(courseEnrollmentsTable.id, initial.id),
        eq(courseEnrollmentsTable.paymentStatus, "pending"),
        lt(courseEnrollmentsTable.expiresAt, now),
      ));
  }

  const [enrollment] = await db
    .select()
    .from(courseEnrollmentsTable)
    .where(eq(courseEnrollmentsTable.id, params.data.id))
    .limit(1);
  if (!enrollment) {
    res.status(404).json({ error: "Inscrição não encontrada." });
    return;
  }
  if (
    enrollment.paymentStatus !== "expired"
    || enrollment.paymentTransactionId
    || enrollment.expiresAt.getTime() >= now.getTime()
  ) {
    res.status(409).json({ error: "Esta inscrição ainda não pode renovar a referência." });
    return;
  }

  const cooldownStartedAt = new Date(now.getTime() - REFERENCE_RENEWAL_COOLDOWN_MS);
  const [claim] = await db
    .update(courseEnrollmentsTable)
    .set({ paymentReferenceRenewalRequestedAt: now, updatedAt: now })
    .where(and(
      eq(courseEnrollmentsTable.id, enrollment.id),
      eq(courseEnrollmentsTable.paymentStatus, "expired"),
      isNull(courseEnrollmentsTable.paymentTransactionId),
      lt(courseEnrollmentsTable.expiresAt, now),
      or(
        isNull(courseEnrollmentsTable.paymentReferenceRenewalRequestedAt),
        lt(courseEnrollmentsTable.paymentReferenceRenewalRequestedAt, cooldownStartedAt),
      ),
    ))
    .returning({ id: courseEnrollmentsTable.id });

  if (!claim) {
    const [latest] = await db
      .select()
      .from(courseEnrollmentsTable)
      .where(eq(courseEnrollmentsTable.id, enrollment.id))
      .limit(1);
    if (!latest) {
      res.status(404).json({ error: "Inscrição não encontrada." });
      return;
    }
    if (
      latest.paymentReferenceRenewalRequestedAt
      && latest.paymentReferenceRenewalRequestedAt.getTime() >= cooldownStartedAt.getTime()
    ) {
      res.status(429).json({ error: "Já existe um pedido recente para renovar esta referência." });
      return;
    }
    res.status(409).json({ error: "Esta inscrição já não pode renovar a referência." });
    return;
  }

  const newExpiresAt = new Date(now.getTime() + REFERENCE_VALIDITY_HOURS * 60 * 60 * 1000);
  let newPaymentReference: string | undefined;
  try {
    newPaymentReference = await createProxyPayReference(
      enrollment.amountKz,
      enrollment.id,
      enrollment.courseId,
      newExpiresAt,
    );
    const [renewed] = await db
      .update(courseEnrollmentsTable)
      .set({
        paymentReference: newPaymentReference,
        paymentStatus: "pending",
        expiresAt: newExpiresAt,
        updatedAt: now,
      })
      .where(and(
        eq(courseEnrollmentsTable.id, enrollment.id),
        eq(courseEnrollmentsTable.paymentStatus, "expired"),
        isNull(courseEnrollmentsTable.paymentTransactionId),
        eq(courseEnrollmentsTable.paymentReferenceRenewalRequestedAt, now),
      ))
      .returning();
    if (!renewed) {
      await proxyPayRequest(`/references/${newPaymentReference}`, { method: "DELETE" }).catch(() => undefined);
      res.status(409).json({ error: "A inscrição foi actualizada por outro pedido. Consulte o estado do pagamento." });
      return;
    }
    res.json(RenewCourseEnrollmentReferenceResponse.parse(checkoutResponse(renewed)));
  } catch (error) {
    if (newPaymentReference) {
      await proxyPayRequest(`/references/${newPaymentReference}`, { method: "DELETE" }).catch(() => undefined);
    }
    if (error instanceof ProxyPayNotConfiguredError) {
      res.status(503).json({ error: "O serviço de pagamentos não está configurado." });
      return;
    }
    const status = error instanceof ProxyPayRequestError ? error.status : undefined;
    req.log.error({ providerStatus: status }, "Course payment reference renewal failed");
    res.status(502).json({ error: "Não foi possível renovar a referência agora. Tente novamente." });
  }
});

router.post("/proxypay/webhook", async (req, res): Promise<void> => {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const signature = req.get("X-Signature")?.trim() ?? "";
  const apiKey = process.env.PROXYPAY_API_KEY;
  if (!rawBody || !signature || !apiKey) {
    res.sendStatus(apiKey ? 400 : 503);
    return;
  }

  const expectedSignature = createHmac("sha256", apiKey).update(rawBody).digest();
  const receivedSignature = Buffer.from(signature, "hex");
  if (
    receivedSignature.length !== expectedSignature.length
    || !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    req.log.warn("Rejected ProxyPay webhook with invalid signature");
    res.sendStatus(401);
    return;
  }

  let eventPayload: unknown;
  try {
    eventPayload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).json({ error: "Notificação de pagamento inválida." });
    return;
  }
  const parsed = ReceiveProxyPayPaymentBody.safeParse(eventPayload);
  if (!parsed.success) {
    res.status(400).json({ error: "Notificação de pagamento inválida." });
    return;
  }

  const event = parsed.data;
  const paymentReference = String(event.reference_id);
  const transactionId = String(event.transaction_id);
  const paidAmount = Number(event.amount);
  const [existing] = await db
    .select()
    .from(courseEnrollmentsTable)
    .where(eq(courseEnrollmentsTable.paymentReference, paymentReference))
    .limit(1);

  if (!existing) {
    req.log.warn({ paymentReference }, "ProxyPay payment has no matching course enrollment");
    res.sendStatus(200);
    return;
  }

  if (!Number.isFinite(paidAmount) || paidAmount !== existing.amountKz) {
    if (existing.paymentStatus === "pending") {
      await db
        .update(courseEnrollmentsTable)
        .set({
          paymentStatus: "review_required",
          paymentTransactionId: transactionId,
          paymentAmountKz: Number.isFinite(paidAmount) ? Math.round(paidAmount) : null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(courseEnrollmentsTable.id, existing.id),
          eq(courseEnrollmentsTable.paymentStatus, "pending"),
        ));
    }
    req.log.warn({ enrollmentId: existing.id }, "ProxyPay payment amount requires manual review");
    res.sendStatus(200);
    return;
  }

  let enrollment = existing;
  if (existing.paymentStatus === "pending") {
    const [updated] = await db
      .update(courseEnrollmentsTable)
      .set({
        paymentStatus: "paid",
        paymentTransactionId: transactionId,
        paymentAmountKz: Math.round(paidAmount),
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(courseEnrollmentsTable.id, existing.id),
        eq(courseEnrollmentsTable.paymentStatus, "pending"),
      ))
      .returning();

    if (updated) {
      enrollment = updated;
    } else {
      const [latest] = await db
        .select()
        .from(courseEnrollmentsTable)
        .where(eq(courseEnrollmentsTable.id, existing.id))
        .limit(1);
      if (latest) enrollment = latest;
    }
  }

  if (
    enrollment.paymentStatus !== "paid"
    || enrollment.paymentTransactionId !== transactionId
  ) {
    req.log.warn({ enrollmentId: enrollment.id }, "Ignored duplicate or non-payable ProxyPay event");
    res.sendStatus(200);
    return;
  }

  const [emailClaim] = await db
    .update(courseEnrollmentsTable)
    .set({ confirmationEmailStatus: "sending", updatedAt: new Date() })
    .where(and(
      eq(courseEnrollmentsTable.id, enrollment.id),
      inArray(courseEnrollmentsTable.confirmationEmailStatus, ["pending", "failed"]),
    ))
    .returning({ id: courseEnrollmentsTable.id });

  if (emailClaim) {
    try {
      await sendCoursePaymentConfirmation({
        enrollmentId: enrollment.id,
        name: enrollment.fullName,
        email: enrollment.email,
        courseTitle: enrollment.courseTitle,
        amountKz: enrollment.amountKz,
        paymentReference: enrollment.paymentReference,
      });
      await db
        .update(courseEnrollmentsTable)
        .set({
          confirmationEmailStatus: "sent",
          confirmationEmailSentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(courseEnrollmentsTable.id, enrollment.id));
    } catch (error) {
      await db
        .update(courseEnrollmentsTable)
        .set({ confirmationEmailStatus: "failed", updatedAt: new Date() })
        .where(eq(courseEnrollmentsTable.id, enrollment.id));
      req.log.error(
        { enrollmentId: enrollment.id, errorName: error instanceof Error ? error.name : "UnknownError" },
        "Payment was recorded but confirmation email failed",
      );
      res.sendStatus(500);
      return;
    }
  }

  res.sendStatus(200);
});

export default router;
