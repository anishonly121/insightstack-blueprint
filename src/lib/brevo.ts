export type EmailMessage = { to: string; subject: string; html: string; text: string };

export async function sendBrevoEmail(
  config: { apiKey: string; fromEmail: string },
  message: EmailMessage,
  request: typeof fetch = fetch,
): Promise<void> {
  const response = await request("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": config.apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: config.fromEmail, name: "InsightStack" },
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
    }),
    signal: AbortSignal.timeout(15000),
  });
  // Provider bodies may contain recipients or message content. Never expose them.
  if (!response.ok) throw new Error(`EMAIL_SEND_FAILED_${response.status}`);
}
