import { describe, expect, it } from "vitest";

import { ACTOR_ROLES } from "@/server/authz/roles";
import {
  AuthorizationError,
  assertHostAccess,
  assertHostOwnsResource,
  assertInviteeCancellationAccess,
  canReadPublicEventType,
} from "@/server/authz/policies";

describe("assertHostAccess", () => {
  it("allows a host context", () => {
    expect(() =>
      assertHostAccess({ role: ACTOR_ROLES.HOST, userId: "user_1" }),
    ).not.toThrow();
  });

  it("rejects an invitee context as forbidden", () => {
    expect(() =>
      assertHostAccess({ role: ACTOR_ROLES.INVITEE }),
    ).toThrow(AuthorizationError);
  });
});

describe("assertHostOwnsResource", () => {
  it("allows a platform admin regardless of ownership", () => {
    expect(() =>
      assertHostOwnsResource(
        { role: ACTOR_ROLES.PLATFORM_ADMIN, userId: "admin_1" },
        { userId: "user_2" },
      ),
    ).not.toThrow();
  });

  it("allows a host that owns the resource", () => {
    expect(() =>
      assertHostOwnsResource(
        { role: ACTOR_ROLES.HOST, userId: "user_1" },
        { userId: "user_1" },
      ),
    ).not.toThrow();
  });

  it("rejects a host that does not own the resource", () => {
    expect(() =>
      assertHostOwnsResource(
        { role: ACTOR_ROLES.HOST, userId: "user_1" },
        { userId: "user_2" },
      ),
    ).toThrow(AuthorizationError);
  });
});

describe("assertInviteeCancellationAccess", () => {
  it("allows a matching cancellation token", () => {
    expect(() =>
      assertInviteeCancellationAccess(
        { role: ACTOR_ROLES.INVITEE, bookingToken: "tok_1" },
        { cancelToken: "tok_1" },
      ),
    ).not.toThrow();
  });

  it("rejects a mismatched cancellation token", () => {
    expect(() =>
      assertInviteeCancellationAccess(
        { role: ACTOR_ROLES.INVITEE, bookingToken: "tok_1" },
        { cancelToken: "tok_2" },
      ),
    ).toThrow(AuthorizationError);
  });

  it("rejects a host context on the invitee-only cancellation path", () => {
    expect(() =>
      assertInviteeCancellationAccess(
        { role: ACTOR_ROLES.HOST, userId: "user_1" },
        { cancelToken: "tok_1" },
      ),
    ).toThrow(AuthorizationError);
  });
});

describe("canReadPublicEventType", () => {
  it("allows host, invitee, and platform admin contexts", () => {
    expect(canReadPublicEventType({ role: ACTOR_ROLES.HOST, userId: "u" })).toBe(
      true,
    );
    expect(canReadPublicEventType({ role: ACTOR_ROLES.INVITEE })).toBe(true);
    expect(
      canReadPublicEventType({ role: ACTOR_ROLES.PLATFORM_ADMIN, userId: "a" }),
    ).toBe(true);
  });
});
