import { NextResponse } from "next/server";

import { getSetupReadiness } from "@/server/services/setup-service";

export async function GET() {
  return NextResponse.json(getSetupReadiness());
}
