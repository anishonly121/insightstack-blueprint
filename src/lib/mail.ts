import "server-only";
import { env } from "@/lib/env";
import { sendBrevoEmail, type EmailMessage } from "@/lib/brevo";
import { passwordResetEmail } from "@/lib/email-content";

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!env.BREVO_API_KEY || !env.EMAIL_FROM) throw new Error("EMAIL_NOT_CONFIGURED");
  await sendBrevoEmail({ apiKey: env.BREVO_API_KEY, fromEmail: env.EMAIL_FROM }, message);
}

export async function sendResetPasswordTemplateEmail(input: {
  to: string;
  name: string;
  resetLink: string;
}): Promise<void> {
  await sendEmail({ to: input.to, ...passwordResetEmail(input.name, input.resetLink) });
}
