import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  courseFileSlug,
  findCourseQuestion,
  filterResponsesByCourse,
} from "@/lib/course-filter";
import { listQuestions, listResponses } from "@/lib/db";
import { toCsv } from "@/lib/stats";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // As perguntas arquivadas entram no CSV para não perder o histórico.
  const [questions, responses] = await Promise.all([
    listQuestions({ includeArchived: true }),
    listResponses(),
  ]);

  const course = new URL(request.url).searchParams.get("curso")?.trim() ?? "";
  const courseQuestion = findCourseQuestion(questions);
  const filtered = filterResponsesByCourse(responses, courseQuestion, course);

  const stamp = new Date().toISOString().slice(0, 10);
  const slug = course ? courseFileSlug(course) : "";
  const filename = slug
    ? `voz-jovem-respostas-${stamp}-${slug}.csv`
    : `voz-jovem-respostas-${stamp}.csv`;

  // O BOM faz o Excel abrir os acentos corretamente.
  return new NextResponse(`\uFEFF${toCsv(questions, filtered)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
