import type { Session } from "next-auth";

import {
  ACTOR_ROLES,
  type CallerContext,
  type HostCallerContext,
} from "@/server/authz";

type RoleClaim = "host" | "platform_admin";

type SessionUserWithRole = Session["user"] & {
  id?: string;
  role?: RoleClaim;
};

export function getCallerFromSession(session: Session | null): CallerContext | null {
  const user = session?.user as SessionUserWithRole | undefined;

  if (!user?.id) {
    return null;
  }

  if (user.role === ACTOR_ROLES.PLATFORM_ADMIN) {
    return {
      role: ACTOR_ROLES.PLATFORM_ADMIN,
      userId: user.id,
    };
  }

  return {
    role: ACTOR_ROLES.HOST,
    userId: user.id,
  };
}

export function assertHostSession(
  session: Session | null,
): HostCallerContext {
  const caller = getCallerFromSession(session);

  if (!caller || caller.role !== ACTOR_ROLES.HOST) {
    throw new Error("Host session is required.");
  }

  return caller;
}
