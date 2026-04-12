import { ACTOR_ROLES, type InviteeCallerContext } from "@/server/authz";

export function createInviteeContext(
  bookingToken?: string,
): InviteeCallerContext {
  return {
    role: ACTOR_ROLES.INVITEE,
    bookingToken,
  };
}
