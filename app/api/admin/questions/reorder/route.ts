import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listQuestions, reorderQuestions } from "@/lib/db";

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

  const body = (payload ?? {}) as Record<string, unknown>;
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];

  const active = await listQuestions();
  const sameSet =
    ids.length === active.length &&
    active.every((question) => ids.includes(question.id));

  if (!sameSet) {
    return NextResponse.json(
      { error: "A nova ordem não corresponde às perguntas publicadas." },
      { status: 400 },
    );
  }

  await reorderQuestions(ids);
  return NextResponse.json({ ok: true });
}
