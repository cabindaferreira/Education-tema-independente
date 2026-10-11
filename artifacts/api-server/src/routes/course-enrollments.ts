import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { Router, type IRouter, type Request } from "express";
import {
  CreateCourseEnrollmentBody,
  CreateCourseEnrollmentResponse,
  GetCourseEnrollmentStatusParams,
  GetCourseEnrollmentStatusResponse,
  ReceiveProxyPayPaymentBody,
} from "@workspace/api-zod";
import { db, courseEnrollmentsTable } from "@workspace/db";
import { COURSE_CATALOG, type CourseId } from "../lib/course-catalog";
import { sendCoursePaymentConfirmation } from "../lib/course-payment-email";

const router: IRouter = Router();
const PROXYPAY_API_URL = "https://api.proxypay.co.ao";
const PROXYPAY_ENTITY = "00413";
const WEBHOOK_URL = "https://education-tema-independente.replit.app/api/proxypay/webhook";
const REFERENCE_VALIDITY_HOURS = 72;

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

async function createProxyPayReference(amountKz: number, enrollmentId: string, courseId: CourseId, expiresAt: Date): Promise<string> {
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
    courseId: enrollment.courseId as CourseId,
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
  const parsed = CreateCourseEnrollmentBody.safeParse(candidate);
  if (!parsed.success) {
    res.status(400).json({ error: "Preencha todos os dados da ficha de inscrição." });
    return;
  }

  const input = parsed.data;
  const course = COURSE_CATALOG[input.courseId];
  const fullName = input.fullName.trim();
  const identityNumber = input.identityNumber.trim();
  const birthDate = input.birthDate;
  if (
    fullName.length < 2
    || identityNumber.length < 3
    || new Date(`${birthDate}T00:00:00Z`).getTime() > Date.now()
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

  if (enrollment.confirmationEmailStatus !== "sent") {
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
