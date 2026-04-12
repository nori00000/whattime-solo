import { NextResponse } from "next/server";
import { z } from "zod";

import { AppError, ERROR_CODES } from "@/lib/domain/error-codes";
import { cancelBookingSchema } from "@/lib/validation/booking";
import { cancelBookingByToken, getBookingByToken } from "@/server/services/booking-service";

type Params = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const booking = await getBookingByToken(resolvedParams.token);

    if (!booking) {
      return NextResponse.json(
        {
          ok: false,
          code: ERROR_CODES.NOT_FOUND,
          message: "Booking not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
        inviteeName: booking.inviteeName,
        startAtUtc: booking.startAtUtc.toISOString(),
        endAtUtc: booking.endAtUtc.toISOString(),
        eventTypeTitle: booking.eventType.title,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: ERROR_CODES.INTERNAL_ERROR,
        message:
          error instanceof Error ? error.message : "Failed to load booking.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = cancelBookingSchema.parse(body);
    const booking = await cancelBookingByToken({
      token: resolvedParams.token,
      reason: parsed.reason,
    });

    return NextResponse.json({
      ok: true,
      booking: {
        id: booking.id,
        status: booking.status,
        canceledAt: booking.canceledAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          code: ERROR_CODES.INVALID_INPUT,
          message: "Invalid cancellation request.",
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
          error instanceof Error ? error.message : "Cancellation failed.",
      },
      { status: 500 },
    );
  }
}
