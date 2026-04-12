import { getPrismaClient } from "@/lib/db/prisma";
import { cancelCalendarEvent } from "@/server/services/calendar-service";

export async function listHostBookings(userId: string) {
  const prisma = getPrismaClient();

  return prisma.booking.findMany({
    where: {
      userId,
    },
    include: {
      eventType: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: {
      startAtUtc: "asc",
    },
  });
}

export async function getHostBooking(userId: string, bookingId: string) {
  const prisma = getPrismaClient();

  return prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
    },
    include: {
      eventType: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
}

export async function cancelHostBooking(input: {
  userId: string;
  bookingId: string;
  reason?: string | null;
}) {
  const prisma = getPrismaClient();
  const booking = await prisma.booking.findFirst({
    where: {
      id: input.bookingId,
      userId: input.userId,
      status: "CONFIRMED",
    },
  });

  if (!booking) {
    throw new Error("Booking not found for this host.");
  }

  if (booking.externalEventId) {
    await cancelCalendarEvent({
      userId: booking.userId,
      externalEventId: booking.externalEventId,
    }).catch(() => undefined);
  }

  return prisma.booking.update({
    where: {
      id: booking.id,
    },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
      note:
        input.reason && input.reason.length > 0
          ? `${booking.note ? `${booking.note}\n\n` : ""}Host cancellation reason: ${input.reason}`
          : booking.note,
    },
  });
}
