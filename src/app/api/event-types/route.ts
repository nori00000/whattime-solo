import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth/server-session";
import { assertHostSession } from "@/lib/auth/session";
import { ERROR_CODES } from "@/lib/domain/error-codes";
import { eventTypeSchema } from "@/lib/validation/event-type";
import {
  createEventType,
  listEventTypes,
} from "@/server/services/event-type-service";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    const host = assertHostSession(session);
    const eventTypes = await listEventTypes(host.userId);

    return NextResponse.json({ eventTypes });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    const host = assertHostSession(session);
    const body = await request.json();
    const parsed = eventTypeSchema.parse(body);
    const eventType = await createEventType(host.userId, parsed);

    return NextResponse.json({ ok: true, eventType }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        ok: false,
        code: ERROR_CODES.INVALID_INPUT,
        message: "Invalid event type payload.",
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
      code: ERROR_CODES.INTERNAL_ERROR,
      message:
        error instanceof Error ? error.message : "Event type request failed.",
    },
    { status: 500 },
  );
}
