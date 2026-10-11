import { ReplitConnectors } from "@replit/connectors-sdk";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  SubscribeToNewsletterBody,
  SubscribeToNewsletterResponse,
  UnsubscribeFromNewsletterBody,
  UnsubscribeFromNewsletterResponse,
} from "@workspace/api-zod";
import { db, newsletterSignupsTable } from "@workspace/db";

const router: IRouter = Router();
const connectors = new ReplitConnectors();

function newsletterSiteUrl(): URL | null {
  const configuredUrl = process.env.NEWSLETTER_UNSUBSCRIBE_BASE_URL?.trim();
  const configuredDomain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  const value = configuredUrl || (configuredDomain ? `https://${configuredDomain}` : "");

  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

function hashUnsubscribeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

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

  const siteUrl = newsletterSiteUrl();
  if (!siteUrl) {
    req.log.error("Newsletter unsubscribe base URL is not configured");
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
    if (
      !signup.unsubscribedAt &&
      signup.confirmationSentAt &&
      signup.unsubscribeTokenHash
    ) {
      return "already_subscribed" as const;
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashUnsubscribeToken(token);
    const unsubscribeUrl = new URL("/unsubscribe", siteUrl);
    unsubscribeUrl.searchParams.set("token", token);

    await tx
      .update(newsletterSignupsTable)
      .set({
        confirmationSentAt: null,
        unsubscribeTokenHash: tokenHash,
        revokedUnsubscribeTokenHash: null,
        unsubscribedAt: null,
      })
      .where(eq(newsletterSignupsTable.id, signup.id));

    const confirmationEmail = {
      subject: "You’re subscribed to the Academia newsletter",
      text: [
        "Thanks for subscribing to the Academia newsletter.",
        "You’ll receive new courses, useful ideas, and learner stories in your inbox.",
        `To stop future newsletter emails, unsubscribe here: ${unsubscribeUrl.toString()}`,
      ].join("\n\n"),
      html: `<p>Thanks for subscribing to the Academia newsletter.</p><p>You’ll receive new courses, useful ideas, and learner stories in your inbox.</p><p><a href="${unsubscribeUrl.toString()}">Unsubscribe from the newsletter</a></p>`,
    };

    try {
      const response = await connectors.proxy("resend", "/emails", {
        method: "POST",
        headers: {
          "Idempotency-Key": `newsletter-confirm-${signup.id}-${tokenHash}`,
        },
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

router.post("/newsletter-unsubscriptions", async (req, res): Promise<void> => {
  const parsed = UnsubscribeFromNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_unsubscribe_token" });
    return;
  }

  const tokenHash = hashUnsubscribeToken(parsed.data.token);
  const status = await db.transaction(async (tx) => {
    const [signup] = await tx
      .select()
      .from(newsletterSignupsTable)
      .where(
        or(
          eq(newsletterSignupsTable.unsubscribeTokenHash, tokenHash),
          eq(newsletterSignupsTable.revokedUnsubscribeTokenHash, tokenHash),
        ),
      )
      .for("update");

    if (!signup) return null;
    if (
      signup.revokedUnsubscribeTokenHash === tokenHash ||
      signup.unsubscribedAt
    ) {
      return "already_unsubscribed" as const;
    }

    await tx
      .update(newsletterSignupsTable)
      .set({
        unsubscribeTokenHash: null,
        revokedUnsubscribeTokenHash: tokenHash,
        unsubscribedAt: new Date(),
      })
      .where(
        and(
          eq(newsletterSignupsTable.id, signup.id),
          eq(newsletterSignupsTable.unsubscribeTokenHash, tokenHash),
          isNull(newsletterSignupsTable.unsubscribedAt),
        ),
      );

    return "unsubscribed" as const;
  });

  if (!status) {
    res.status(404).json({ error: "invalid_unsubscribe_token" });
    return;
  }

  res.json(UnsubscribeFromNewsletterResponse.parse({ status }));
});

export default router;
