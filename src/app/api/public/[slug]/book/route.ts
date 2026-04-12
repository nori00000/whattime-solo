import { NextResponse } from "next/server";
import { z } from "zod";

import { createBookingSchema } from "@/lib/validation/booking";
import { AppError, ERROR_CODES } from "@/lib/domain/error-codes";
import { createBooking } from "@/server/services/booking-service";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const parsed = createBookingSchema.parse(body);
    const booking = await createBooking({
      slug: resolvedParams.slug,
      slotStart: new Date(parsed.slotStart),
      timezone: parsed.timezone,
      inviteeName: parsed.inviteeName,
      inviteeEmail: parsed.inviteeEmail,
      note: parsed.note,
    });

    return NextResponse.json(
      {
        ok: true,
        booking: {
          id: booking.id,
          startAtUtc: booking.startAtUtc.toISOString(),
          endAtUtc: booking.endAtUtc.toISOString(),
          cancelToken: booking.cancelToken,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          code: ERROR_CODES.INVALID_INPUT,
          message: "Invalid booking request.",
        },
        { status: 400 },
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          ok: false,
          code: error.code,
          message: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: ERROR_CODES.INTERNAL_ERROR,
        message:
          error instanceof Error ? error.message : "Booking failed.",
      },
      { status: 500 },
    );
  }
}
