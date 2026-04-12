import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth/server-session";
import { assertHostSession } from "@/lib/auth/session";
import { ERROR_CODES } from "@/lib/domain/error-codes";
import { updateBusyCheckSelection } from "@/server/services/calendar-service";

const updateCalendarSchema = z.object({
  selectedForBusyCheck: z.boolean(),
});

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
    const parsed = updateCalendarSchema.parse(body);
    const resolvedParams = await params;

    const calendar = await updateBusyCheckSelection({
      userId: host.userId,
      calendarId: resolvedParams.id,
      selectedForBusyCheck: parsed.selectedForBusyCheck,
    });

    return NextResponse.json({ ok: true, calendar });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          code: ERROR_CODES.INVALID_INPUT,
          message: "Invalid calendar update payload.",
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
          error instanceof Error ? error.message : "Calendar update failed.",
      },
      { status: 404 },
    );
  }
}
