import { NextResponse } from "next/server";

import { ERROR_CODES } from "@/lib/domain/error-codes";
import { getPublicEventTypeBySlug } from "@/server/services/availability-service";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const eventType = await getPublicEventTypeBySlug(resolvedParams.slug);

    if (!eventType) {
      return NextResponse.json(
        {
          ok: false,
          code: ERROR_CODES.NOT_FOUND,
          message: "Public event type not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      eventType: {
        slug: eventType.slug,
        title: eventType.title,
        description: eventType.description,
        durationMinutes: eventType.durationMinutes,
        timezone: eventType.user.timezone,
        hostName: eventType.user.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: ERROR_CODES.INTERNAL_ERROR,
        message:
          error instanceof Error ? error.message : "Failed to load public page.",
      },
      { status: 500 },
    );
  }
}
