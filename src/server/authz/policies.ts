import {
  ACTOR_ROLES,
  type CallerContext,
  isHostContext,
  isInviteeContext,
  isPlatformAdminContext,
} from "@/server/authz/roles";

export class AuthorizationError extends Error {
  code: "UNAUTHORIZED" | "FORBIDDEN";

  constructor(code: "UNAUTHORIZED" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

type HostOwnedResource = {
  userId: string;
};

type TokenScopedResource = {
  cancelToken: string;
};

export function assertHostAccess(context: CallerContext): asserts context is {
  role: typeof ACTOR_ROLES.HOST;
  userId: string;
} {
  if (isHostContext(context)) {
    return;
  }

  if (isInviteeContext(context)) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "Invitee access is not permitted on host-only routes.",
    );
  }

  throw new AuthorizationError(
    "UNAUTHORIZED",
    "A host session is required for this operation.",
  );
}

export function assertHostOwnsResource(
  context: CallerContext,
  resource: HostOwnedResource,
): void {
  if (isPlatformAdminContext(context)) {
    return;
  }

  assertHostAccess(context);

  if (context.userId !== resource.userId) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "The current host does not own this resource.",
    );
  }
}

export function assertInviteeCancellationAccess(
  context: CallerContext,
  resource: TokenScopedResource,
): void {
  if (!isInviteeContext(context)) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "Only invitee token access is permitted for this cancellation path.",
    );
  }

  if (!context.bookingToken) {
    throw new AuthorizationError(
      "UNAUTHORIZED",
      "A cancellation token is required.",
    );
  }

  if (context.bookingToken !== resource.cancelToken) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "The cancellation token does not match this booking.",
    );
  }
}

export function canReadPublicEventType(context: CallerContext): boolean {
  return (
    isHostContext(context) ||
    isInviteeContext(context) ||
    isPlatformAdminContext(context)
  );
}

export function buildAuditActorRole(context: CallerContext): string {
  return context.role;
}
