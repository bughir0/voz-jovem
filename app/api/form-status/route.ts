import { NextResponse } from "next/server";
import { getFormStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Situação atual do formulário, sem login — o site público consulta daqui. */
export async function GET() {
  return NextResponse.json(
    { status: await getFormStatus() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
