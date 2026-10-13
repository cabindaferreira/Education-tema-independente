import { ReplitConnectors } from "@replit/connectors-sdk";
import { Router, type IRouter } from "express";
import {
  CreateCourseEnrollmentRequestBody,
  CreateCourseEnrollmentRequestResponse,
  SubscribeToNewsletterBody,
} from "@workspace/api-zod";
import { and, eq, isNull } from "drizzle-orm";
import { academyCoursesTable, db } from "@workspace/db";
import { ensureDefaultAcademyCourses } from "../lib/course-catalog-db";

const router: IRouter = Router();
const connectors = new ReplitConnectors();
const ACADEMY_EMAIL = "academia@procenter.co.ao";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character]!;
  });
}

router.post("/course-enrollment-requests", async (req, res): Promise<void> => {
  const candidate =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body as Record<string, unknown>
      : undefined;
  const body = candidate
    ? {
        ...candidate,
        fullName: typeof candidate.fullName === "string" ? candidate.fullName.trim() : candidate.fullName,
        phone: typeof candidate.phone === "string" ? candidate.phone.trim() : candidate.phone,
        email: typeof candidate.email === "string" ? candidate.email.trim() : candidate.email,
      }
    : req.body;
  const parsed = CreateCourseEnrollmentRequestBody.safeParse(body);

  if (!parsed.success || (parsed.success && parsed.data.phone.replace(/\D/g, "").length < 7)) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }

  const { courseId, fullName, phone } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  await ensureDefaultAcademyCourses();
  const [course] = await db
    .select()
    .from(academyCoursesTable)
    .where(and(
      eq(academyCoursesTable.id, courseId),
      eq(academyCoursesTable.published, true),
      isNull(academyCoursesTable.archivedAt),
    ))
    .limit(1);
  if (!course) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }
  const sender = process.env.NEWSLETTER_FROM_EMAIL?.trim();

  if (!sender) {
    req.log.error("Course request sender address is not configured");
    res.status(502).json({ error: "email_delivery_failed" });
    return;
  }

  const senderAddress = sender.match(/<([^<>]+)>/)?.[1] ?? sender;
  if (!SubscribeToNewsletterBody.safeParse({ email: senderAddress }).success) {
    req.log.error("Course request sender address is invalid");
    res.status(502).json({ error: "email_delivery_failed" });
    return;
  }

  const text = [
    "Novo pedido de inscrição recebido pelo site.",
    "",
    `Formação: ${course.title}`,
    `Nome: ${fullName}`,
    `Telefone: ${phone}`,
    `E-mail: ${email}`,
    "",
    "A pessoa confirmou que leu o aviso de privacidade.",
  ].join("\n");
  const html = [
    "<h2>Novo pedido de inscrição</h2>",
    `<p><strong>Formação:</strong> ${escapeHtml(course.title)}</p>`,
    `<p><strong>Nome:</strong> ${escapeHtml(fullName)}</p>`,
    `<p><strong>Telefone:</strong> ${escapeHtml(phone)}</p>`,
    `<p><strong>E-mail:</strong> ${escapeHtml(email)}</p>`,
    "<p>A pessoa confirmou que leu o aviso de privacidade.</p>",
  ].join("");

  try {
    const response = await connectors.proxy("resend", "/emails", {
      method: "POST",
      body: {
        from: sender,
        to: ACADEMY_EMAIL,
        reply_to: email,
        subject: `Pedido de inscrição: ${course.title}`,
        text,
        html,
      },
    });

    if (!response.ok) {
      req.log.error(
        { statusCode: response.status },
        "Course request email provider rejected the request",
      );
      res.status(502).json({ error: "email_delivery_failed" });
      return;
    }
  } catch {
    req.log.error("Course request email delivery failed");
    res.status(502).json({ error: "email_delivery_failed" });
    return;
  }

  res.status(201).json(CreateCourseEnrollmentRequestResponse.parse({ status: "received" }));
});

export default router;
