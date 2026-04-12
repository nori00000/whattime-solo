import { NextResponse } from "next/server";

import { getSetupDiagnostics } from "@/server/services/setup-service";

export async function GET() {
  return NextResponse.json(await getSetupDiagnostics());
}
