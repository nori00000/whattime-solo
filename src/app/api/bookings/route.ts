import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth/server-session";
import { assertHostSession } from "@/lib/auth/session";
import { ERROR_CODES } from "@/lib/domain/error-codes";
import { listHostBookings } from "@/server/services/host-booking-service";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    const host = assertHostSession(session);
    const bookings = await listHostBookings(host.userId);

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: ERROR_CODES.UNAUTHORIZED,
        message:
          error instanceof Error ? error.message : "Failed to load bookings.",
      },
      { status: 401 },
    );
  }
}
