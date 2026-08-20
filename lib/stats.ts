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

const CSV_SEPARATOR = ";";
const TIME_ZONE = "America/Sao_Paulo";

const csvDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const csvTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Uma célula nunca pode conter quebra de linha: o texto livre da pesquisa é
 * digitado em várias linhas e isso partiria a resposta em várias linhas da
 * planilha. As aspas só entram quando o conteúdo realmente precisa delas.
 */
function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  const single = text.replace(/\s*\r?\n\s*/g, " / ").trim();
  return /["\r\n]|;/.test(single)
    ? `"${single.replace(/"/g, '""')}"`
    : single;
}

/** Numa pergunta derivada o texto de "Outro" fica guardado na pergunta origem. */
function otherSourceId(question: Question): string | null {
  if (question.type === "derived") return question.sourceQuestionId;
  return question.allowOther ? question.id : null;
}

type CsvColumn = {
  header: string;
  value: (response: StoredResponse, index: number) => string | number;
};

function buildColumns(questions: Question[]): CsvColumn[] {
  const columns: CsvColumn[] = [
    { header: "Nº", value: (_response, index) => index + 1 },
    {
      header: "Data",
      value: (response) => csvDate.format(new Date(response.createdAt)),
    },
    {
      header: "Hora",
      value: (response) => csvTime.format(new Date(response.createdAt)),
    },
  ];

  questions.forEach((question, index) => {
    const number = index + 1;
    const suffix = question.archived ? " (arquivada)" : "";

    columns.push({
      header: `${number}. ${question.title}${suffix}`,
      value: (response) =>
        formatAnswer(question, response.answers[question.id], {
          withOtherText: false,
        }),
    });

    // O texto de "Outro" ganha coluna própria para não se misturar com a
    // alternativa marcada, o que atrapalharia contar as respostas.
    const sourceId = otherSourceId(question);
    if (sourceId) {
      columns.push({
        header: `${number}. Outro (texto)`,
        value: (response) => {
          const marked = response.answers[question.id]?.choices ?? [];
          if (!marked.includes(OTHER_CHOICE)) return "";
          return response.answers[sourceId]?.other?.trim() ?? "";
        },
      });
    }
  });

  columns.push({ header: "ID da resposta", value: (response) => response.id });

  return columns;
}

export function toCsv(
  questions: Question[],
  responses: StoredResponse[],
): string {
  const columns = buildColumns(questions);
  // Da mais antiga para a mais recente, para a numeração acompanhar a coleta.
  const ordered = [...responses].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  const header = columns.map((column) => csvCell(column.header));
  const lines = ordered.map((response, index) =>
    columns
      .map((column) => csvCell(column.value(response, index)))
      .join(CSV_SEPARATOR),
  );

  // `sep=` avisa o Excel qual é o separador, independente do idioma do sistema.
  return [
    `sep=${CSV_SEPARATOR}`,
    header.join(CSV_SEPARATOR),
    ...lines,
  ].join("\r\n");
}
