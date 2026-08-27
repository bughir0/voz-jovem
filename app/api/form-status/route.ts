import { NextResponse } from "next/server";
import { getSurveySnapshot } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Situação e perguntas atuais — o site público consulta daqui. */
export async function GET() {
  return NextResponse.json(await getSurveySnapshot(), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}
