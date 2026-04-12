import { describe, expect, it, vi } from "vitest";

import { AppError, ERROR_CODES } from "../../lib/domain/error-codes";
import { createBookingService } from "./booking-service";

function makeDeps() {
  return {
    prisma: {
      bookingLock: {
        create: vi.fn(),
        delete: vi.fn().mockResolvedValue(undefined),
      },
      booking: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    },
    getPublicEventTypeBySlug: vi.fn(),
    getPublicAvailability: vi.fn(),
    createCalendarEvent: vi.fn(),
    cancelCalendarEvent: vi.fn(),
    createCancelToken: vi.fn(() => "cancel-token"),
    now: vi.fn(() => new Date("2026-04-15T00:00:00.000Z")),
  };
}

describe("booking service", () => {
  it("rejects unavailable slots before creating a lock", async () => {
    const deps = makeDeps();
    deps.getPublicEventTypeBySlug.mockResolvedValue({
      id: "evt_1",
      title: "Intro Call",
      description: null,
      user: { id: "user_1", timezone: "Asia/Seoul" },
    });
    deps.getPublicAvailability.mockResolvedValue({
      eventType: { id: "evt_1" },
      slots: [],
    });

    const service = createBookingService(deps as never);

    await expect(
      service.createBooking({
        slug: "intro-call",
        slotStart: new Date("2026-04-16T01:00:00.000Z"),
        timezone: "Asia/Seoul",
        inviteeName: "Kim",
        inviteeEmail: "kim@example.com",
      }),
    ).rejects.toMatchObject<AppError>({
      code: ERROR_CODES.SLOT_UNAVAILABLE,
      status: 409,
    });

    expect(deps.prisma.bookingLock.create).not.toHaveBeenCalled();
  });

  it("creates booking after lock and second availability check", async () => {
    const deps = makeDeps();
    const slot = {
      start: new Date("2026-04-16T01:00:00.000Z"),
      end: new Date("2026-04-16T01:30:00.000Z"),
    };

    deps.getPublicEventTypeBySlug.mockResolvedValue({
      id: "evt_1",
      title: "Intro Call",
      description: "Short intro",
      user: { id: "user_1", timezone: "Asia/Seoul" },
    });
    deps.getPublicAvailability
      .mockResolvedValueOnce({
        eventType: { id: "evt_1" },
        slots: [slot],
      })
      .mockResolvedValueOnce({
        eventType: { id: "evt_1" },
        slots: [slot],
      });
    deps.prisma.bookingLock.create.mockResolvedValue({ id: "lock_1" });
    deps.createCalendarEvent.mockResolvedValue({ id: "gcal_1" });
    deps.prisma.booking.create.mockResolvedValue({
      id: "booking_1",
      cancelToken: "cancel-token",
      startAtUtc: slot.start,
      endAtUtc: slot.end,
    });

    const service = createBookingService(deps as never);
    const booking = await service.createBooking({
      slug: "intro-call",
      slotStart: slot.start,
      timezone: "Asia/Seoul",
      inviteeName: "Kim",
      inviteeEmail: "kim@example.com",
      note: "hello",
    });

    expect(deps.prisma.bookingLock.create).toHaveBeenCalledTimes(1);
    expect(deps.createCalendarEvent).toHaveBeenCalledTimes(1);
    expect(deps.prisma.booking.create).toHaveBeenCalledTimes(1);
    expect(deps.prisma.bookingLock.delete).toHaveBeenCalledWith({
      where: { id: "lock_1" },
    });
    expect(booking.id).toBe("booking_1");
  });

  it("fails safely when the second availability check loses the slot", async () => {
    const deps = makeDeps();
    const slot = {
      start: new Date("2026-04-16T01:00:00.000Z"),
      end: new Date("2026-04-16T01:30:00.000Z"),
    };

    deps.getPublicEventTypeBySlug.mockResolvedValue({
      id: "evt_1",
      title: "Intro Call",
      description: null,
      user: { id: "user_1", timezone: "Asia/Seoul" },
    });
    deps.getPublicAvailability
      .mockResolvedValueOnce({
        eventType: { id: "evt_1" },
        slots: [slot],
      })
      .mockResolvedValueOnce({
        eventType: { id: "evt_1" },
        slots: [],
      });
    deps.prisma.bookingLock.create.mockResolvedValue({ id: "lock_1" });

    const service = createBookingService(deps as never);

    await expect(
      service.createBooking({
        slug: "intro-call",
        slotStart: slot.start,
        timezone: "Asia/Seoul",
        inviteeName: "Kim",
        inviteeEmail: "kim@example.com",
      }),
    ).rejects.toMatchObject<AppError>({
      code: ERROR_CODES.BOOKING_LOCK_FAILED,
      status: 409,
    });

    expect(deps.createCalendarEvent).not.toHaveBeenCalled();
    expect(deps.prisma.booking.create).not.toHaveBeenCalled();
    expect(deps.prisma.bookingLock.delete).toHaveBeenCalled();
  });

  it("throws not found when cancel token has no booking", async () => {
    const deps = makeDeps();
    deps.prisma.booking.findFirst.mockResolvedValue(null);
    const service = createBookingService(deps as never);

    await expect(
      service.cancelBookingByToken({ token: "missing" }),
    ).rejects.toMatchObject<AppError>({
      code: ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });
});
