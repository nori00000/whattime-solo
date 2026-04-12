import { addDays } from "date-fns";

import { computeAvailableSlots } from "@/lib/availability/engine";
import type {
  DateOverrideInput,
  TimeInterval,
} from "@/lib/availability/types";
import { getPrismaClient } from "@/lib/db/prisma";
import { getBusyIntervals } from "@/server/services/calendar-service";

export async function getPublicEventTypeBySlug(slug: string) {
  const prisma = getPrismaClient();

  return prisma.eventType.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          timezone: true,
        },
      },
      availabilityRules: {
        orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
      },
      dateOverrides: {
        orderBy: {
          date: "asc",
        },
      },
    },
  });
}

function toBlockedIntervals(intervals: Array<{ startAtUtc: Date; endAtUtc: Date }>): TimeInterval[] {
  return intervals.map((interval) => ({
    start: interval.startAtUtc,
    end: interval.endAtUtc,
  }));
}

function toLockIntervals(
  intervals: Array<{ slotStartAtUtc: Date; slotEndAtUtc: Date }>,
): TimeInterval[] {
  return intervals.map((interval) => ({
    start: interval.slotStartAtUtc,
    end: interval.slotEndAtUtc,
  }));
}

function toDateOverrides(
  overrides: Array<{
    date: Date;
    isUnavailable: boolean;
    startMinute: number | null;
    endMinute: number | null;
  }>,
): DateOverrideInput[] {
  return overrides.map((override) => ({
    date: override.date,
    isUnavailable: override.isUnavailable,
    startMinute: override.startMinute,
    endMinute: override.endMinute,
  }));
}

export async function getPublicAvailability(input: {
  slug: string;
  from?: Date;
  to?: Date;
  ignoreLockId?: string;
}) {
  const prisma = getPrismaClient();
  const eventType = await getPublicEventTypeBySlug(input.slug);

  if (!eventType) {
    throw new Error("Public event type not found.");
  }

  const from = input.from ?? new Date();
  const to =
    input.to ??
    addDays(from, Math.min(eventType.bookingWindowEndDays, 14));

  const [bookings, locks, busyIntervals] = await Promise.all([
    prisma.booking.findMany({
      where: {
        eventTypeId: eventType.id,
        status: "CONFIRMED",
        startAtUtc: {
          gte: from,
          lte: to,
        },
      },
      select: {
        startAtUtc: true,
        endAtUtc: true,
      },
    }),
    prisma.bookingLock.findMany({
      where: {
        eventTypeId: eventType.id,
        ...(input.ignoreLockId
          ? {
              id: {
                not: input.ignoreLockId,
              },
            }
          : {}),
        expiresAt: {
          gt: new Date(),
        },
        slotStartAtUtc: {
          gte: from,
          lte: to,
        },
      },
      select: {
        slotStartAtUtc: true,
        slotEndAtUtc: true,
      },
    }),
    getBusyIntervals({
      userId: eventType.user.id,
      from,
      to,
    }).catch(() => []),
  ]);

  const slots = computeAvailableSlots({
    from,
    to,
    now: new Date(),
    durationMinutes: eventType.durationMinutes,
    slotIntervalMinutes: eventType.slotIntervalMinutes,
    minimumNoticeMinutes: eventType.minimumNoticeMinutes,
    bufferBeforeMinutes: eventType.bufferBeforeMinutes,
    bufferAfterMinutes: eventType.bufferAfterMinutes,
    rules: eventType.availabilityRules.map((rule) => ({
      dayOfWeek: rule.dayOfWeek,
      startMinute: rule.startMinute,
      endMinute: rule.endMinute,
    })),
    overrides: toDateOverrides(eventType.dateOverrides),
    busyIntervals,
    blockedIntervals: [
      ...toBlockedIntervals(bookings),
      ...toLockIntervals(locks),
    ],
  });

  return {
    eventType: {
      id: eventType.id,
      slug: eventType.slug,
      title: eventType.title,
      description: eventType.description,
      durationMinutes: eventType.durationMinutes,
      timezone: eventType.user.timezone,
      hostName: eventType.user.name,
    },
    slots,
  };
}
