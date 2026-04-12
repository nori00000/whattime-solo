import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_ENCRYPTION_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  MAIL_FROM: z.string().email(),
  APP_TIMEZONE: z.string().min(1).default("Asia/Seoul"),
});

export type AppEnv = z.infer<typeof envSchema>;

export const REQUIRED_ENV_KEYS = envSchema.keyof().options;

export type RequiredEnvKey = (typeof REQUIRED_ENV_KEYS)[number];

export function parseAppEnv(input: NodeJS.ProcessEnv): AppEnv {
  return envSchema.parse(input);
}

export function getRequiredEnv(key: RequiredEnvKey): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}

export function summarizeEnvReadiness(): {
  key: RequiredEnvKey;
  configured: boolean;
}[] {
  return REQUIRED_ENV_KEYS.map((key) => ({
    key,
    configured: Boolean(process.env[key]),
  }));
}
