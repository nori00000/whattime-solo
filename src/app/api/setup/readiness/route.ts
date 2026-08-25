import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth/server-session";
import { assertHostSession } from "@/lib/auth/session";
import { ERROR_CODES } from "@/lib/domain/error-codes";
import { getSetupReadiness } from "@/server/services/setup-service";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    assertHostSession(session);

    return NextResponse.json(getSetupReadiness());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: ERROR_CODES.UNAUTHORIZED,
        message:
          error instanceof Error ? error.message : "Host session is required.",
      },
      { status: 401 },
    );
  }
}
