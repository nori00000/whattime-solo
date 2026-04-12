import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth/server-session";
import { assertHostSession } from "@/lib/auth/session";
import { AppError, ERROR_CODES } from "@/lib/domain/error-codes";
import {
  listConnectedCalendars,
  syncConnectedCalendars,
} from "@/server/services/calendar-service";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    const host = assertHostSession(session);
    const calendars = await listConnectedCalendars(host.userId);

    return NextResponse.json({ calendars });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST() {
  try {
    const session = await getServerAuthSession();
    const host = assertHostSession(session);
    const calendars = await syncConnectedCalendars(host.userId);

    return NextResponse.json({ calendars });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
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
      code: ERROR_CODES.CALENDAR_API_ERROR,
      message:
        error instanceof Error ? error.message : "Calendar sync failed.",
    },
    { status: 500 },
  );
}
