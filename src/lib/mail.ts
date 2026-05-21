import "server-only";
import sgMail from "@sendgrid/mail";
import { env } from "@/lib/env";

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
