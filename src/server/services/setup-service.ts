import { summarizeEnvReadiness } from "@/lib/config/env";
import { getPrismaClient } from "@/lib/db/prisma";
import { encryptSecret } from "@/lib/security/encryption";

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

export async function getSetupDiagnostics() {
  const prisma = getPrismaClient();

  try {
    await prisma.user.count();
    await prisma.calendarAccount.count();
    await prisma.connectedCalendar.count();

    const encrypted = encryptSecret("diag");

    return {
      databaseQueryOk: true,
      userTableOk: true,
      calendarAccountTableOk: true,
      connectedCalendarTableOk: true,
      encryptionOk: Boolean(encrypted),
    };
  } catch (error) {
    return {
      databaseQueryOk: false,
      userTableOk: false,
      calendarAccountTableOk: false,
      connectedCalendarTableOk: false,
      encryptionOk: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown setup diagnostics failure.",
    };
  }
}
