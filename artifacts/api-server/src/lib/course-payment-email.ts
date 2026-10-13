import { ReplitConnectors } from "@replit/connectors-sdk";

const FROM_EMAIL = "Academia Procenter <academia@procenter.co.ao>";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendCoursePaymentConfirmation(input: {
  enrollmentId: string;
  name: string;
  email: string;
  courseTitle: string;
  amountKz: number;
  paymentReference: string;
  idempotencyKey?: string;
}): Promise<void> {
  const connectors = new ReplitConnectors();
  const safeName = escapeHtml(input.name);
  const safeCourseTitle = escapeHtml(input.courseTitle);
  const amount = `${input.amountKz.toLocaleString("pt-PT")} Kz`;
  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: {
      "Idempotency-Key": input.idempotencyKey ?? `course-payment-confirmation-${input.enrollmentId}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: input.email,
      subject: `Pagamento confirmado — ${input.courseTitle}`,
      text: [
        `Olá, ${input.name}.`,
        "",
        `Confirmamos o pagamento da inscrição em ${input.courseTitle}.`,
        `Valor: ${amount}.`,
        `Referência: ${input.paymentReference}.`,
        "A equipa da Academia Procenter entrará em contacto com os próximos passos.",
      ].join("\n"),
      html: `
        <div style="margin:0;background:#f7f4f1;padding:32px 16px;font-family:Arial,sans-serif;color:#302728">
          <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
            <div style="background:#c91f2e;padding:24px 28px;color:#fff">
              <strong style="font-size:22px">Academia Procenter</strong>
            </div>
            <div style="padding:28px">
              <p>Olá, ${safeName}.</p>
              <h1 style="font-size:24px;margin:0 0 12px">Pagamento confirmado</h1>
              <p>Confirmamos o pagamento da sua inscrição em <strong>${safeCourseTitle}</strong>.</p>
              <p><strong>Valor:</strong> ${amount}<br /><strong>Referência:</strong> ${escapeHtml(input.paymentReference)}</p>
              <p>A equipa da Academia Procenter entrará em contacto com os próximos passos.</p>
            </div>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend returned HTTP ${response.status}`);
  }
}
