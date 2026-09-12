import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  eventTypeFindFirst: vi.fn(),
  bookingFindMany: vi.fn(),
  bookingLockFindMany: vi.fn(),
  getBusyIntervals: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  getPrismaClient: () => ({
    eventType: { findFirst: mocks.eventTypeFindFirst },
    booking: { findMany: mocks.bookingFindMany },
    bookingLock: { findMany: mocks.bookingLockFindMany },
  }),
}));

vi.mock("./calendar-service", () => ({
  getBusyIntervals: mocks.getBusyIntervals,
}));

import { getPublicAvailability } from "./availability-service";

const from = new Date("2026-04-13T01:00:00.000Z");
const to = new Date("2026-04-13T03:00:00.000Z");

function publicEventType() {
  return {
    id: "event_1",
    slug: "intro-call",
    title: "Intro Call",
    description: null,
    durationMinutes: 30,
    slotIntervalMinutes: 30,
    minimumNoticeMinutes: 0,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    bookingWindowEndDays: 14,
    user: { id: "user_1", name: "Host", timezone: "UTC" },
    availabilityRules: [{ dayOfWeek: 1, startMinute: 60, endMinute: 180 }],
    dateOverrides: [],
  };
}

describe("public availability persistence filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eventTypeFindFirst.mockResolvedValue(publicEventType());
    mocks.bookingLockFindMany.mockResolvedValue([]);
    mocks.getBusyIntervals.mockResolvedValue([]);
  });

  it("fetches a confirmed booking that began before the requested window", async () => {
    mocks.bookingFindMany.mockResolvedValue([
      {
        startAtUtc: new Date("2026-04-13T00:30:00.000Z"),
        endAtUtc: new Date("2026-04-13T01:30:00.000Z"),
      },
    ]);

    const availability = await getPublicAvailability({
      slug: "intro-call",
      from,
      to,
    });

    expect(mocks.bookingFindMany).toHaveBeenCalledWith({
      where: {
        eventTypeId: "event_1",
        status: "CONFIRMED",
        endAtUtc: { gt: from },
        startAtUtc: { lt: to },
      },
      select: { startAtUtc: true, endAtUtc: true },
    });
    expect(availability.eventType.id).toBe("event_1");
  });

  it("keeps back-to-back intervals available by using strict overlap boundaries", async () => {
    mocks.bookingFindMany.mockResolvedValue([]);

    await getPublicAvailability({ slug: "intro-call", from, to });

    expect(mocks.bookingLockFindMany).toHaveBeenCalledWith({
      where: {
        eventTypeId: "event_1",
        expiresAt: { gt: expect.any(Date) },
        slotEndAtUtc: { gt: from },
        slotStartAtUtc: { lt: to },
      },
      select: { slotStartAtUtc: true, slotEndAtUtc: true },
    });
  });
});
