import { getPrismaClient } from "@/lib/db/prisma";
import { buildEventTypeSlug } from "@/lib/utils/slug";
import type { EventTypeInput } from "@/lib/validation/event-type";

export async function listEventTypes(userId: string) {
  const prisma = getPrismaClient();

  return prisma.eventType.findMany({
    where: {
      userId,
    },
    include: {
      availabilityRules: {
        orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createEventType(userId: string, input: EventTypeInput) {
  const prisma = getPrismaClient();
  let slug = buildEventTypeSlug(input.title);
  let collisionCount = 0;

  while (collisionCount < 5) {
    const existing = await prisma.eventType.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      break;
    }

    slug = buildEventTypeSlug(input.title);
    collisionCount += 1;
  }

  return prisma.eventType.create({
    data: {
      userId,
      slug,
      title: input.title,
      description: input.description ?? null,
      durationMinutes: input.durationMinutes,
      bufferBeforeMinutes: input.bufferBeforeMinutes,
      bufferAfterMinutes: input.bufferAfterMinutes,
      bookingWindowStartDays: input.bookingWindowStartDays,
      bookingWindowEndDays: input.bookingWindowEndDays,
      minimumNoticeMinutes: input.minimumNoticeMinutes,
      slotIntervalMinutes: input.slotIntervalMinutes,
      isActive: input.isActive,
      availabilityRules: {
        create: input.availabilityRules.map((rule) => ({
          dayOfWeek: rule.dayOfWeek,
          startMinute: rule.startMinute,
          endMinute: rule.endMinute,
        })),
      },
    },
    include: {
      availabilityRules: {
        orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
      },
    },
  });
}

export async function updateEventType(
  userId: string,
  eventTypeId: string,
  input: EventTypeInput,
) {
  const prisma = getPrismaClient();
  const existing = await prisma.eventType.findFirst({
    where: {
      id: eventTypeId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("Event type not found for this host.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.availabilityRule.deleteMany({
      where: {
        eventTypeId,
      },
    });

    return tx.eventType.update({
      where: {
        id: eventTypeId,
      },
      data: {
        title: input.title,
        description: input.description ?? null,
        durationMinutes: input.durationMinutes,
        bufferBeforeMinutes: input.bufferBeforeMinutes,
        bufferAfterMinutes: input.bufferAfterMinutes,
        bookingWindowStartDays: input.bookingWindowStartDays,
        bookingWindowEndDays: input.bookingWindowEndDays,
        minimumNoticeMinutes: input.minimumNoticeMinutes,
        slotIntervalMinutes: input.slotIntervalMinutes,
        isActive: input.isActive,
        availabilityRules: {
          create: input.availabilityRules.map((rule) => ({
            dayOfWeek: rule.dayOfWeek,
            startMinute: rule.startMinute,
            endMinute: rule.endMinute,
          })),
        },
      },
      include: {
        availabilityRules: {
          orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
        },
      },
    });
  });
}
