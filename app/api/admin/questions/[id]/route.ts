import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  countAnswersFor,
  deleteQuestion,
  findDependentQuestions,
  getQuestion,
  listQuestions,
  setQuestionArchived,
  updateQuestion,
} from "@/lib/db";
import { parseQuestionInput } from "@/lib/parse-question";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

function notFound() {
  return NextResponse.json(
    { error: "Pergunta não encontrada." },
    { status: 404 },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return unauthorized();

  const { id } = await params;
  const existing = await getQuestion(id);
  if (!existing) return notFound();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const body = (payload ?? {}) as Record<string, unknown>;

  // Restaurar uma pergunta arquivada é a única alteração que vem sozinha.
  if (typeof body.archived === "boolean" && Object.keys(body).length === 1) {
    if (body.archived) {
      const dependents = await findDependentQuestions(id);
      if (dependents.length > 0) {
        return NextResponse.json(
          { error: dependencyMessage(dependents.map((item) => item.title)) },
          { status: 409 },
        );
      }
    }
    await setQuestionArchived(id, body.archived);
    return NextResponse.json({ ok: true });
  }

  const questions = await listQuestions({ includeArchived: true });
  const parsed = parseQuestionInput(payload, questions, id);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Perguntas derivadas só funcionam com uma origem de múltipla escolha.
  if (existing.type === "multiple" && parsed.input.type !== "multiple") {
    const dependents = await findDependentQuestions(id);
    if (dependents.length > 0) {
      return NextResponse.json(
        {
          error: `Não é possível mudar o tipo: ${dependents
            .map((item) => `“${item.title}”`)
            .join(", ")} usa as alternativas desta pergunta.`,
        },
        { status: 409 },
      );
    }
  }

  await updateQuestion(id, parsed.input);
  return NextResponse.json({ ok: true });
}

function dependencyMessage(titles: string[]): string {
  return `Antes disso, ajuste ou arquive ${titles
    .map((title) => `“${title}”`)
    .join(", ")}, que usa as alternativas desta pergunta.`;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) return unauthorized();

  const { id } = await params;
  const existing = await getQuestion(id);
  if (!existing) return notFound();

  const dependents = await findDependentQuestions(id);
  if (dependents.length > 0) {
    return NextResponse.json(
      { error: dependencyMessage(dependents.map((item) => item.title)) },
      { status: 409 },
    );
  }

  // Sem respostas gravadas nada se perde, então a pergunta sai de vez.
  const force = new URL(request.url).searchParams.get("force") === "1";
  const answered = await countAnswersFor(id);
  if (force || answered === 0) {
    await deleteQuestion(id);
    return NextResponse.json({ ok: true, mode: "deleted" });
  }

  await setQuestionArchived(id, true);
  return NextResponse.json({ ok: true, mode: "archived", answered });
}
