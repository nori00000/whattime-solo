import { describe, expect, it } from "vitest";

import { createBookingSchema } from "./booking";

describe("createBookingSchema", () => {
  it("accepts a valid booking request", () => {
    const parsed = createBookingSchema.parse({
      slotStart: "2026-04-16T01:00:00.000Z",
      timezone: "Asia/Seoul",
      inviteeName: "Kim",
      inviteeEmail: "kim@example.com",
      note: "Looking forward to it.",
    });

    expect(parsed.inviteeEmail).toBe("kim@example.com");
  });

  it("rejects invalid email values", () => {
    expect(() =>
      createBookingSchema.parse({
        slotStart: "2026-04-16T01:00:00.000Z",
        timezone: "Asia/Seoul",
        inviteeName: "Kim",
        inviteeEmail: "not-an-email",
      }),
    ).toThrow();
  });
});
