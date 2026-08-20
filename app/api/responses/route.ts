import { NextResponse } from "next/server";
import { getFormStatus, insertResponse, listQuestions } from "@/lib/db";
import {
  isQuestionApplicable,
  optionsFor,
  scaleValues,
  validateAnswer,
} from "@/lib/question-utils";
import {
  FORM_STATUS_NOTICE,
  OTHER_CHOICE,
  type Answer,
  type Answers,
  type Question,
} from "@/lib/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function text(value: unknown, limit = 400): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

/** Mantém apenas dados que a pergunta aceita, descartando o resto do envio. */
function sanitize(
  question: Question,
  raw: unknown,
  answers: Answers,
): Answer | null {
  const body = (raw ?? {}) as Record<string, unknown>;

  if (question.type === "text") {
    const value = text(body.text, 2000);
    return value ? { text: value } : null;
  }

  if (question.type === "scale") {
    const value = Number(body.number);
    return scaleValues(question).includes(value) ? { number: value } : null;
  }

  const allowed = optionsFor(question, answers);
  const raws = Array.isArray(body.choices) ? body.choices : [];
  const choices = Array.from(
    new Set(raws.map((item) => text(item, 300)).filter((item) => allowed.includes(item))),
  ).slice(0, question.type === "multiple" ? (question.maxChoices ?? allowed.length) : 1);

  if (choices.length === 0) return null;

  const other =
    choices.includes(OTHER_CHOICE) && question.type !== "derived"
      ? text(body.other, 300)
      : "";

  return other ? { choices, other } : { choices };
}

export async function POST(request: Request) {
  // Quem já tinha o formulário aberto na tela quando ele foi pausado ou
  // encerrado precisa saber por que o envio não foi aceito.
  const status = await getFormStatus();
  if (status !== "open") {
    const notice = FORM_STATUS_NOTICE[status];
    return NextResponse.json(
      { error: `${notice.title}. ${notice.text}` },
      { status: 403 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const body = (payload ?? {}) as Record<string, unknown>;

  const name = text(body.name, 120);
  const email = text(body.email, 160).toLowerCase();
  if (name.length < 2)
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  if (!EMAIL_PATTERN.test(email))
    return NextResponse.json(
      { error: "E-mail é obrigatório e precisa ser válido." },
      { status: 400 },
    );

  const questions = await listQuestions();
  if (questions.length === 0)
    return NextResponse.json(
      { error: "A pesquisa não tem perguntas publicadas." },
      { status: 400 },
    );

  const received = (body.answers ?? {}) as Record<string, unknown>;
  const answers: Answers = {};

  // Perguntas derivadas dependem da resposta de origem, por isso vêm depois.
  const ordered = [
    ...questions.filter((question) => question.type !== "derived"),
    ...questions.filter((question) => question.type === "derived"),
  ];

  for (const question of ordered) {
    const answer = sanitize(question, received[question.id], answers);
    if (answer) answers[question.id] = answer;
  }

  for (const question of questions) {
    if (!isQuestionApplicable(question, questions, answers)) continue;
    const message = validateAnswer(question, answers[question.id], answers);
    if (message) {
      return NextResponse.json(
        { error: `${question.title} — ${message}` },
        { status: 400 },
      );
    }
  }

  try {
    const saved = await insertResponse({ name, email, answers });
    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
  } catch (error) {
    console.error("Falha ao salvar resposta:", error);
    return NextResponse.json(
      { error: "Erro ao salvar. Tente novamente em alguns segundos." },
      { status: 500 },
    );
  }
}
