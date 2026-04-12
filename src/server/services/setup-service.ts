import { summarizeEnvReadiness } from "@/lib/config/env";

export function getSetupReadiness() {
  const env = summarizeEnvReadiness();
  const configuredCount = env.filter((item) => item.configured).length;

  return {
    env,
    configuredCount,
    totalCount: env.length,
    readyForLiveAuth:
      env.find((item) => item.key === "GOOGLE_CLIENT_ID")?.configured &&
      env.find((item) => item.key === "GOOGLE_CLIENT_SECRET")?.configured &&
      env.find((item) => item.key === "NEXTAUTH_SECRET")?.configured &&
      env.find((item) => item.key === "NEXTAUTH_URL")?.configured,
    readyForDatabase: env.find((item) => item.key === "DATABASE_URL")?.configured,
    readyForEmail:
      env.find((item) => item.key === "RESEND_API_KEY")?.configured &&
      env.find((item) => item.key === "MAIL_FROM")?.configured,
  };
}
