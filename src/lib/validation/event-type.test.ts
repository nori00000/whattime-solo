import { describe, expect, it } from "vitest";

import { eventTypeSchema } from "./event-type";

describe("eventTypeSchema", () => {
  it("accepts a valid event type payload", () => {
    const parsed = eventTypeSchema.parse({
      title: "30-minute intro call",
      description: "Short intro",
      durationMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 15,
      bookingWindowStartDays: 0,
      bookingWindowEndDays: 30,
      minimumNoticeMinutes: 60,
      slotIntervalMinutes: 30,
      isActive: true,
      availabilityRules: [
        {
          dayOfWeek: 1,
          startMinute: 600,
          endMinute: 1080,
        },
      ],
    });

    expect(parsed.title).toBe("30-minute intro call");
    expect(parsed.availabilityRules).toHaveLength(1);
  });

  it("rejects invalid weekday values", () => {
    expect(() =>
      eventTypeSchema.parse({
        title: "Bad rule",
        durationMinutes: 30,
        availabilityRules: [
          {
            dayOfWeek: 9,
            startMinute: 600,
            endMinute: 1080,
          },
        ],
      }),
    ).toThrow();
  });
});
