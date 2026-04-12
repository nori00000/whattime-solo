import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";
import { assertHostSession } from "@/lib/auth/session";

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function requireHostPageSession() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/sign-in");
  }

  return assertHostSession(session);
}
