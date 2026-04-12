import type { Account, Profile } from "next-auth";

import { getPrismaClient } from "@/lib/db/prisma";
import { encryptSecret } from "@/lib/security/encryption";

type PersistGoogleAccountInput = {
  email: string;
  name?: string | null;
  image?: string | null;
  profile?: Profile;
  account: Account;
};

export async function persistGoogleAccount(
  input: PersistGoogleAccountInput,
) {
  const prisma = getPrismaClient();
  const user = await prisma.user.upsert({
    where: {
      email: input.email,
    },
    update: {
      name: input.name ?? undefined,
      image: input.image ?? undefined,
    },
    create: {
      email: input.email,
      name: input.name ?? undefined,
      image: input.image ?? undefined,
    },
  });

  const accessToken = input.account.access_token ?? null;
  const refreshToken = input.account.refresh_token;

  if (!accessToken && !refreshToken) {
    throw new Error(
      "Google account persistence requires at least one OAuth token.",
    );
  }

  const expiresAt =
    typeof input.account.expires_at === "number"
      ? new Date(input.account.expires_at * 1000)
      : null;

  await prisma.calendarAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: "GOOGLE",
        providerAccountId: input.account.providerAccountId,
      },
    },
    update: {
      userId: user.id,
      email: input.email,
      accessTokenEnc: encryptSecret(accessToken ?? ""),
      refreshTokenEnc: refreshToken ? encryptSecret(refreshToken) : null,
      scope: input.account.scope ?? null,
      expiresAt,
    },
    create: {
      userId: user.id,
      provider: "GOOGLE",
      providerAccountId: input.account.providerAccountId,
      email: input.email,
      accessTokenEnc: encryptSecret(accessToken ?? ""),
      refreshTokenEnc: refreshToken ? encryptSecret(refreshToken) : null,
      scope: input.account.scope ?? null,
      expiresAt,
    },
  });

  return user;
}
