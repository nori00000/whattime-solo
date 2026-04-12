import { NextResponse } from "next/server";
import { format } from "date-fns";
import { z } from "zod";

import { ERROR_CODES } from "@/lib/domain/error-codes";
import { publicSlotsQuerySchema } from "@/lib/validation/public-slots";
import { getPublicAvailability } from "@/server/services/availability-service";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const url = new URL(request.url);
    const parsed = publicSlotsQuerySchema.parse({
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });

    const availability = await getPublicAvailability({
      slug: resolvedParams.slug,
      from: parsed.from ? new Date(parsed.from) : undefined,
      to: parsed.to ? new Date(parsed.to) : undefined,
    });

    return NextResponse.json({
      eventType: availability.eventType,
      slots: availability.slots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        displayLabel: format(slot.start, "yyyy-MM-dd HH:mm"),
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          code: ERROR_CODES.INVALID_INPUT,
          message: "Invalid slot query parameters.",
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to load slots.";
    const status = message.includes("not found") ? 404 : 500;

    return NextResponse.json(
      {
        ok: false,
        code: status === 404 ? ERROR_CODES.NOT_FOUND : ERROR_CODES.INTERNAL_ERROR,
        message,
      },
      { status },
    );
  }
}
