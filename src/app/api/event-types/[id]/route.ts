import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth/server-session";
import { assertHostSession } from "@/lib/auth/session";
import { ERROR_CODES } from "@/lib/domain/error-codes";
import { eventTypeSchema } from "@/lib/validation/event-type";
import { updateEventType } from "@/server/services/event-type-service";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerAuthSession();
    const host = assertHostSession(session);
    const body = await request.json();
    const parsed = eventTypeSchema.parse(body);
    const resolvedParams = await params;
    const eventType = await updateEventType(host.userId, resolvedParams.id, parsed);

    return NextResponse.json({ ok: true, eventType });
  } catch (error) {
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
        code: ERROR_CODES.NOT_FOUND,
        message:
          error instanceof Error ? error.message : "Event type update failed.",
      },
      { status: 404 },
    );
  }
}
