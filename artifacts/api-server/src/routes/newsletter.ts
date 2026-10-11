import { ReplitConnectors } from "@replit/connectors-sdk";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  SubscribeToNewsletterBody,
  SubscribeToNewsletterResponse,
} from "@workspace/api-zod";
import { db, newsletterSignupsTable } from "@workspace/db";

const router: IRouter = Router();
const connectors = new ReplitConnectors();

const confirmationEmail = {
  subject: "You’re subscribed to the Academia newsletter",
  text: "Thanks for subscribing to the Academia newsletter. You’ll receive new courses, useful ideas, and learner stories in your inbox.",
  html: "<p>Thanks for subscribing to the Academia newsletter.</p><p>You’ll receive new courses, useful ideas, and learner stories in your inbox.</p>",
};

router.post("/newsletter-signups", async (req, res): Promise<void> => {
  const body =
    req.body && typeof req.body.email === "string"
      ? { ...req.body, email: req.body.email.trim() }
      : req.body;
  const parsed = SubscribeToNewsletterBody.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_email" });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const sender = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  if (!sender) {
    req.log.error("Newsletter sender address is not configured");
    res.status(502).json({ error: "email_delivery_failed" });
    return;
  }

  const senderAddressIsValid = SubscribeToNewsletterBody.safeParse({
    email: sender.match(/<([^<>]+)>/)?.[1] ?? sender,
  }).success;
  if (!senderAddressIsValid) {
    req.log.error("Newsletter sender address is invalid");
    res.status(502).json({ error: "email_delivery_failed" });
    return;
  }

  const status = await db.transaction(async (tx) => {
    await tx
      .insert(newsletterSignupsTable)
      .values({ email })
      .onConflictDoNothing({ target: newsletterSignupsTable.email });

    const [signup] = await tx
      .select()
      .from(newsletterSignupsTable)
      .where(eq(newsletterSignupsTable.email, email))
      .for("update");

    if (!signup) {
      req.log.error("Newsletter signup could not be loaded after insert");
      return "email_delivery_failed" as const;
    }
    if (signup.confirmationSentAt) {
      return "already_subscribed" as const;
    }

    try {
      const response = await connectors.proxy("resend", "/emails", {
        method: "POST",
        headers: { "Idempotency-Key": `newsletter-confirm-${signup.id}` },
        body: {
          from: sender,
          to: email,
          ...confirmationEmail,
        },
      });

      if (!response.ok) {
        req.log.error(
          { statusCode: response.status },
          "Newsletter confirmation email provider rejected the request",
        );
        return "email_delivery_failed" as const;
      }
    } catch {
      req.log.error("Newsletter confirmation email request failed");
      return "email_delivery_failed" as const;
    }

    await tx
      .update(newsletterSignupsTable)
      .set({ confirmationSentAt: new Date() })
      .where(eq(newsletterSignupsTable.id, signup.id));

    return "confirmation_sent" as const;
  });

  if (status === "email_delivery_failed") {
    res.status(502).json({ error: "email_delivery_failed" });
    return;
  }

  const response = SubscribeToNewsletterResponse.parse({ status });
  res.status(status === "confirmation_sent" ? 201 : 200).json(response);
});

export default router;
