import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listQuestions, listResponses } from "@/lib/db";
import { toCsv } from "@/lib/stats";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // As perguntas arquivadas entram no CSV para não perder o histórico.
  const [questions, responses] = await Promise.all([
    listQuestions({ includeArchived: true }),
    listResponses(),
  ]);
  const stamp = new Date().toISOString().slice(0, 10);

  // O BOM faz o Excel abrir os acentos corretamente.
  return new NextResponse(`\uFEFF${toCsv(questions, responses)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="voz-jovem-respostas-${stamp}.csv"`,
    },
  });
}
