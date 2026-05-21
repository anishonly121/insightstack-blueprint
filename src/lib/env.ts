import "server-only";
import { z } from "zod";

const emptyToUndefined = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  NEXT_PUBLIC_APP_URL: z.string().min(1, "NEXT_PUBLIC_APP_URL is required"),
  SENDGRID_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SENDGRID_FROM_EMAIL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SENDGRID_TEMPLATE_RESET_PASSWORD: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SENDGRID_TEMPLATE_ALERT: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SENDGRID_PASSWORD_RESET_TEMPLATE_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const keys = parsed.error.issues
    .map((issue) => issue.path.join("."))
    .filter(Boolean)
    .join(", ");
  throw new Error(`Invalid environment configuration. Missing/invalid: ${keys}`);
}

export const env = parsed.data;
