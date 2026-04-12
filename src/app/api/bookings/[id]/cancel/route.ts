import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth/server-session";
import { assertHostSession } from "@/lib/auth/session";
import { ERROR_CODES } from "@/lib/domain/error-codes";
import { cancelBookingSchema } from "@/lib/validation/booking";
import { cancelHostBooking } from "@/server/services/host-booking-service";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerAuthSession();
    const host = assertHostSession(session);
    const resolvedParams = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = cancelBookingSchema.parse(body);
    const booking = await cancelHostBooking({
      userId: host.userId,
      bookingId: resolvedParams.id,
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

    if (error instanceof Error && error.message.includes("Host session")) {
      return NextResponse.json(
        {
          ok: false,
          code: ERROR_CODES.UNAUTHORIZED,
          message: error.message,
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: ERROR_CODES.NOT_FOUND,
        message:
          error instanceof Error ? error.message : "Host cancellation failed.",
      },
      { status: 404 },
    );
  }
}
