import { addSeconds } from "date-fns";
import { randomBytes } from "crypto";

import { getPrismaClient } from "@/lib/db/prisma";
import { AppError, ERROR_CODES } from "@/lib/domain/error-codes";
import { APP_CONFIG } from "@/lib/config/app-config";
import { getPublicAvailability, getPublicEventTypeBySlug } from "@/server/services/availability-service";
import { cancelCalendarEvent, createCalendarEvent } from "@/server/services/calendar-service";
import type { Slot } from "@/lib/availability/types";

type BookingRecord = {
  id: string;
  userId: string;
  eventTypeId: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteeTimezone: string;
  note: string | null;
  startAtUtc: Date;
  endAtUtc: Date;
  status: "CONFIRMED" | "CANCELED";
  externalEventId: string | null;
  cancelToken: string;
  canceledAt?: Date | null;
};

type BookingWithEventType = BookingRecord & {
  eventType: {
    title: string;
  };
};

type BookingServiceDeps = {
  prisma: {
    bookingLock: {
      create(args: {
        data: {
          eventTypeId: string;
          slotStartAtUtc: Date;
          slotEndAtUtc: Date;
          expiresAt: Date;
        };
      }): Promise<{ id: string }>;
      delete(args: { where: { id: string } }): Promise<unknown>;
    };
    booking: {
      create(args: {
        data: {
          userId: string;
          eventTypeId: string;
          inviteeName: string;
          inviteeEmail: string;
          inviteeTimezone: string;
          note: string | null;
          startAtUtc: Date;
          endAtUtc: Date;
          status: "CONFIRMED";
          externalEventId: string | null;
          cancelToken: string;
        };
      }): Promise<BookingRecord>;
      findFirst(args: {
        where: unknown;
        include?: unknown;
      }): Promise<BookingWithEventType | BookingRecord | null>;
      update(args: {
        where: unknown;
        data: unknown;
      }): Promise<BookingRecord>;
    };
  };
  getPublicEventTypeBySlug: typeof getPublicEventTypeBySlug;
  getPublicAvailability: typeof getPublicAvailability;
  createCalendarEvent: typeof createCalendarEvent;
  cancelCalendarEvent: typeof cancelCalendarEvent;
  createCancelToken: () => string;
  now: () => Date;
};

function createCancelToken() {
  return randomBytes(24).toString("hex");
}

function createBookingServiceDeps(): BookingServiceDeps {
  const prisma = getPrismaClient();
  type BookingCreateArgs = Parameters<typeof prisma.booking.create>[0];
  type BookingFindFirstArgs = Parameters<typeof prisma.booking.findFirst>[0];
  type BookingUpdateArgs = Parameters<typeof prisma.booking.update>[0];

  return {
    prisma: {
      bookingLock: prisma.bookingLock,
      booking: {
        create: (args) =>
          prisma.booking.create(args as BookingCreateArgs) as Promise<BookingRecord>,
        findFirst: (args) =>
          prisma.booking.findFirst(args as BookingFindFirstArgs) as Promise<
            BookingWithEventType | BookingRecord | null
          >,
        update: (args) =>
          prisma.booking.update(args as BookingUpdateArgs) as Promise<BookingRecord>,
      },
    },
    getPublicEventTypeBySlug,
    getPublicAvailability,
    createCalendarEvent,
    cancelCalendarEvent,
    createCancelToken,
    now: () => new Date(),
  };
}

export function createBookingService(deps: BookingServiceDeps) {
  async function findBookableSlot(input: {
    slug: string;
    slotStart: Date;
    ignoreLockId?: string;
  }) {
    const from = input.slotStart;
    const to = new Date(input.slotStart.getTime() + 24 * 60 * 60 * 1000);
    const availability = await deps.getPublicAvailability({
      slug: input.slug,
      from,
      to,
      ignoreLockId: input.ignoreLockId,
    });

    return {
      eventType: availability.eventType,
      slot: availability.slots.find(
        (slot: Slot) =>
          slot.start.toISOString() === input.slotStart.toISOString(),
      ),
    };
  }

  return {
    async createBooking(input: {
      slug: string;
      slotStart: Date;
      timezone: string;
      inviteeName: string;
      inviteeEmail: string;
      note?: string | null;
    }) {
      const eventTypeRecord = await deps.getPublicEventTypeBySlug(input.slug);

      if (!eventTypeRecord) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 404, "Event type not found.");
      }

      const { eventType, slot } = await findBookableSlot({
        slug: input.slug,
        slotStart: input.slotStart,
      });

      if (!slot) {
        throw new AppError(
          ERROR_CODES.SLOT_UNAVAILABLE,
          409,
          "The selected time is no longer available.",
        );
      }

      const lockExpiry = addSeconds(deps.now(), APP_CONFIG.bookingLockTtlSeconds);
      const lock = await deps.prisma.bookingLock.create({
        data: {
          eventTypeId: eventType.id,
          slotStartAtUtc: slot.start,
          slotEndAtUtc: slot.end,
          expiresAt: lockExpiry,
        },
      });

      try {
        const secondCheck = await findBookableSlot({
          slug: input.slug,
          slotStart: input.slotStart,
          ignoreLockId: lock.id,
        });

        if (!secondCheck.slot) {
          throw new AppError(
            ERROR_CODES.BOOKING_LOCK_FAILED,
            409,
            "The selected time could not be reserved safely.",
          );
        }

        const externalEvent = await deps.createCalendarEvent({
          userId: eventTypeRecord.user.id,
          title: eventTypeRecord.title,
          description: eventTypeRecord.description,
          inviteeName: input.inviteeName,
          inviteeEmail: input.inviteeEmail,
          start: secondCheck.slot.start,
          end: secondCheck.slot.end,
          timezone: eventTypeRecord.user.timezone,
        });

        const booking = await deps.prisma.booking.create({
          data: {
            userId: eventTypeRecord.user.id,
            eventTypeId: eventTypeRecord.id,
            inviteeName: input.inviteeName,
            inviteeEmail: input.inviteeEmail,
            inviteeTimezone: input.timezone,
            note: input.note ?? null,
            startAtUtc: secondCheck.slot.start,
            endAtUtc: secondCheck.slot.end,
            status: "CONFIRMED",
            externalEventId: externalEvent.id ?? null,
            cancelToken: deps.createCancelToken(),
          },
        });

        await deps.prisma.bookingLock.delete({
          where: {
            id: lock.id,
          },
        });

        return booking;
      } catch (error) {
        await deps.prisma.bookingLock
          .delete({
            where: {
              id: lock.id,
            },
          })
          .catch(() => undefined);

        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          500,
          error instanceof Error ? error.message : "Booking confirmation failed.",
        );
      }
    },

    async cancelBookingByToken(input: {
      token: string;
      reason?: string | null;
    }) {
      const booking = (await deps.prisma.booking.findFirst({
        where: {
          cancelToken: input.token,
          status: "CONFIRMED",
        },
        include: {
          eventType: true,
        },
      })) as BookingWithEventType | null;

      if (!booking) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 404, "Booking not found.");
      }

      if (booking.externalEventId) {
        await deps.cancelCalendarEvent({
          userId: booking.userId,
          externalEventId: booking.externalEventId,
        }).catch(() => undefined);
      }

      return deps.prisma.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status: "CANCELED",
          canceledAt: deps.now(),
          note:
            input.reason && input.reason.length > 0
              ? `${booking.note ? `${booking.note}\n\n` : ""}Cancellation reason: ${input.reason}`
              : booking.note,
        },
      });
    },

    async getBookingByToken(token: string) {
      return (await deps.prisma.booking.findFirst({
        where: {
          cancelToken: token,
        },
        include: {
          eventType: true,
        },
      })) as BookingWithEventType | null;
    },
  };
}

export async function createBooking(input: {
  slug: string;
  slotStart: Date;
  timezone: string;
  inviteeName: string;
  inviteeEmail: string;
  note?: string | null;
}) {
  return createBookingService(createBookingServiceDeps()).createBooking(input);
}

export async function cancelBookingByToken(input: {
  token: string;
  reason?: string | null;
}) {
  return createBookingService(createBookingServiceDeps()).cancelBookingByToken(
    input,
  );
}

export async function getBookingByToken(token: string) {
  return createBookingService(createBookingServiceDeps()).getBookingByToken(
    token,
  );
}
