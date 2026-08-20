import { formatAnswer, hasChoices, scaleValues } from "./question-utils";
import { OTHER_CHOICE, type Question, type StoredResponse } from "./types";

export type Slice = { name: string; value: number; percent: number };

export type TextAnswer = {
  responseId: string;
  name: string;
  text: string;
};

export type QuestionStats = {
  question: Question;
  answered: number;
  slices: Slice[];
  average: number | null;
  texts: TextAnswer[];
};

export type Stats = {
  total: number;
  perDay: { name: string; value: number }[];
  questions: QuestionStats[];
};

function buildSlices(
  values: string[],
  order: string[],
  denominator: number,
): Slice[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const known = order
    .filter((name) => counts.has(name))
    .map((name) => ({ name, value: counts.get(name) ?? 0 }));

  const extras = [...counts.entries()]
    .filter(([name]) => !order.includes(name))
    .map(([name, value]) => ({ name, value }));

  return [...known, ...extras].map((item) => ({
    ...item,
    percent: denominator > 0 ? (item.value / denominator) * 100 : 0,
  }));
}

function statsForQuestion(
  question: Question,
  responses: StoredResponse[],
): QuestionStats {
  const answers = responses
    .map((response) => ({ response, answer: response.answers[question.id] }))
    .filter((item) => Boolean(item.answer));

  if (question.type === "scale") {
    const numbers = answers
      .map((item) => item.answer?.number)
      .filter((value): value is number => typeof value === "number");

    const order = scaleValues(question).map(String);
    return {
      question,
      answered: numbers.length,
      slices: buildSlices(numbers.map(String), order, numbers.length),
      average:
        numbers.length > 0
          ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
          : null,
      texts: [],
    };
  }

  if (question.type === "text") {
    const texts = answers
      .filter((item) => item.answer?.text?.trim())
      .map((item) => ({
        responseId: item.response.id,
        name: item.response.name,
        text: item.answer?.text?.trim() ?? "",
      }));

    return {
      question,
      answered: texts.length,
      slices: [],
      average: null,
      texts,
    };
  }

  const withChoices = answers.filter(
    (item) => (item.answer?.choices?.length ?? 0) > 0,
  );
  const chosen = withChoices.flatMap((item) => item.answer?.choices ?? []);

  // Derivadas não têm lista fixa; a ordem sai das alternativas mais votadas.
  const order = hasChoices(question)
    ? question.type === "derived"
      ? []
      : [...question.options, ...(question.allowOther ? [OTHER_CHOICE] : [])]
    : [];

  const slices = buildSlices(chosen, order, withChoices.length);

  return {
    question,
    answered: withChoices.length,
    slices:
      question.type === "derived"
        ? [...slices].sort((a, b) => b.value - a.value)
        : slices,
    average: null,
    texts: [],
  };
}

export function buildStats(
  questions: Question[],
  responses: StoredResponse[],
): Stats {
  const byDay = new Map<string, number>();
  for (const response of responses) {
    const day = response.createdAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }

  const perDay = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => {
      const [, month, dayOfMonth] = day.split("-");
      return { name: `${dayOfMonth}/${month}`, value };
    });

  return {
    total: responses.length,
    perDay,
    questions: questions.map((question) =>
      statsForQuestion(question, responses),
    ),
  };
}

export function toCsv(
  questions: Question[],
  responses: StoredResponse[],
): string {
  const headers = [
    "ID",
    "Data/Hora",
    "Nome",
    "E-mail",
    ...questions.map(
      (question, index) =>
        `${index + 1}. ${question.title}${question.archived ? " (arquivada)" : ""}`,
    ),
  ];

  const escape = (value: string | number | null) => {
    const text = value === null ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = responses.map((response) =>
    [
      response.id,
      new Date(response.createdAt).toLocaleString("pt-BR"),
      response.name,
      response.email,
      ...questions.map((question) =>
        formatAnswer(question, response.answers[question.id]),
      ),
    ]
      .map(escape)
      .join(";"),
  );

  return [headers.map(escape).join(";"), ...lines].join("\r\n");
}
