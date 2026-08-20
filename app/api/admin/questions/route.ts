import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createQuestion, listQuestions } from "@/lib/db";
import { parseQuestionInput } from "@/lib/parse-question";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return NextResponse.json({
    questions: await listQuestions({ includeArchived: true }),
  });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const questions = await listQuestions({ includeArchived: true });
  const parsed = parseQuestionInput(payload, questions);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const question = await createQuestion(parsed.input);
  return NextResponse.json({ ok: true, question }, { status: 201 });
}
