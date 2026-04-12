export const ACTOR_ROLES = {
  PLATFORM_ADMIN: "platform_admin",
  HOST: "host",
  INVITEE: "invitee",
} as const;

export type ActorRole = (typeof ACTOR_ROLES)[keyof typeof ACTOR_ROLES];

export type HostCallerContext = {
  role: typeof ACTOR_ROLES.HOST;
  userId: string;
};

export type PlatformAdminCallerContext = {
  role: typeof ACTOR_ROLES.PLATFORM_ADMIN;
  userId: string;
};

export type InviteeCallerContext = {
  role: typeof ACTOR_ROLES.INVITEE;
  bookingToken?: string;
};

export type CallerContext =
  | HostCallerContext
  | PlatformAdminCallerContext
  | InviteeCallerContext;

export function isHostContext(
  context: CallerContext,
): context is HostCallerContext {
  return context.role === ACTOR_ROLES.HOST;
}

export function isPlatformAdminContext(
  context: CallerContext,
): context is PlatformAdminCallerContext {
  return context.role === ACTOR_ROLES.PLATFORM_ADMIN;
}

export function isInviteeContext(
  context: CallerContext,
): context is InviteeCallerContext {
  return context.role === ACTOR_ROLES.INVITEE;
}
