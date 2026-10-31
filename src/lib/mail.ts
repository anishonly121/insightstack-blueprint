import "server-only";
import sgMail from "@sendgrid/mail";
import { env } from "@/lib/env";
import { sendBrevoEmail, type EmailMessage } from "@/lib/brevo";
import { escapeEmailHtml, passwordResetEmail } from "@/lib/email-content";

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (env.BREVO_API_KEY) {
    if (!env.EMAIL_FROM) throw new Error("EMAIL_NOT_CONFIGURED");
    await sendBrevoEmail({ apiKey: env.BREVO_API_KEY, fromEmail: env.EMAIL_FROM }, message);
    return;
  }
  const config = getSendGridConfig();
  if (!config) throw new Error("EMAIL_NOT_CONFIGURED");
  sgMail.setApiKey(config.apiKey);
  await sgMail.send({ ...message, from: { email: config.fromEmail, name: "InsightStack" } });
}

type DynamicTemplateData = Record<string, string | number | boolean | null>;

type SendTemplateEmailInput = {
  to: string;
  templateId: string;
  dynamicTemplateData: DynamicTemplateData;
  subject?: string;
};

const getSendGridConfig = (): {
  apiKey: string;
  fromEmail: string;
} | null => {
  const apiKey = env.SENDGRID_API_KEY;
  const fromEmail = env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return null;
  }

  return { apiKey, fromEmail };
};

const getResetTemplateId = (): string | null => {
  return (
    env.SENDGRID_TEMPLATE_RESET_PASSWORD ??
    env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID ??
    null
  );
};

const getAlertTemplateId = (): string | null => {
  return env.SENDGRID_TEMPLATE_ALERT ?? null;
};

export async function sendTemplateEmail(input: SendTemplateEmailInput): Promise<void> {
  const config = getSendGridConfig();

  if (!config) {
    throw new Error("SENDGRID_NOT_CONFIGURED");
  }

  sgMail.setApiKey(config.apiKey);

  await sgMail.send({
    to: input.to,
    from: config.fromEmail,
    templateId: input.templateId,
    dynamicTemplateData: input.dynamicTemplateData,
    subject: input.subject,
  });
}

export async function sendResetPasswordTemplateEmail(input: {
  to: string;
  name: string;
  resetLink: string;
}): Promise<void> {
  if (env.BREVO_API_KEY) {
    await sendEmail({ to: input.to, ...passwordResetEmail(input.name, input.resetLink) });
    return;
  }
  const templateId = getResetTemplateId();

  if (!templateId) {
    throw new Error("SENDGRID_NOT_CONFIGURED");
  }

  await sendTemplateEmail({
    to: input.to,
    templateId,
    dynamicTemplateData: {
      name: input.name,
      reset_link: input.resetLink,
      app_name: process.env.NEXT_PUBLIC_APP_NAME ?? "InsightStack",
      year: new Date().getFullYear(),
    },
  });
}

export async function sendAlertTemplateEmail(input: {
  to: string;
  name: string;
  message: string;
}): Promise<void> {
  if (env.BREVO_API_KEY) {
    await sendEmail({ to: input.to, subject: "Your InsightStack notification",
      text: `Hi ${input.name},\n\n${input.message}`,
      html: `<p>Hi ${escapeEmailHtml(input.name)},</p><p>${escapeEmailHtml(input.message)}</p>` });
    return;
  }
  const templateId = getAlertTemplateId();

  if (!templateId) {
    throw new Error("SENDGRID_NOT_CONFIGURED");
  }

  await sendTemplateEmail({
    to: input.to,
    templateId,
    dynamicTemplateData: {
      name: input.name,
      message: input.message,
      app_name: process.env.NEXT_PUBLIC_APP_NAME ?? "InsightStack",
      year: new Date().getFullYear(),
    },
  });
}
