import { DEFAULT_QUESTION_IDS } from "./default-questions";
import { formatAnswer } from "./question-utils";
import type { Question, StoredResponse } from "./types";

/** Valor do filtro quando o painel mostra todas as respostas. */
export const ALL_COURSES = "";

export const MISSING_COURSE_LABEL = "Sem curso informado";

export type CourseOption = {
  value: string;
  count: number;
};

/** A pergunta de curso do questionário, se ainda estiver publicada. */
export function findCourseQuestion(
  questions: Question[],
): Question | undefined {
  const byId = questions.find(
    (question) => question.id === DEFAULT_QUESTION_IDS.course,
  );
  if (byId) return byId;

  return questions.find(
    (question) => question.type === "single" && /curso/i.test(question.title),
  );
}

/** Nome do curso desta resposta, já com o texto de “Outro” quando houver. */
export function responseCourseLabel(
  response: StoredResponse,
  question: Question,
): string {
  const label = formatAnswer(question, response.answers[question.id]).trim();
  return label || MISSING_COURSE_LABEL;
}

/**
 * Cursos que aparecem nas respostas, na ordem das alternativas oficiais, com
 * os “Outro” em seguida e as respostas sem curso por último.
 */
export function listCourseOptions(
  responses: StoredResponse[],
  question: Question,
): CourseOption[] {
  const counts = new Map<string, number>();
  for (const response of responses) {
    const label = responseCourseLabel(response, question);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const official = question.options
    .filter((name) => counts.has(name))
    .map((name) => ({ value: name, count: counts.get(name) ?? 0 }));

  const extras = [...counts.entries()]
    .filter(
      ([name]) =>
        !question.options.includes(name) && name !== MISSING_COURSE_LABEL,
    )
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
    .map(([value, count]) => ({ value, count }));

  const missing = counts.has(MISSING_COURSE_LABEL)
    ? [
        {
          value: MISSING_COURSE_LABEL,
          count: counts.get(MISSING_COURSE_LABEL) ?? 0,
        },
      ]
    : [];

  return [...official, ...extras, ...missing];
}

export function filterResponsesByCourse(
  responses: StoredResponse[],
  question: Question | undefined,
  course: string,
): StoredResponse[] {
  if (!question || !course) return responses;
  return responses.filter(
    (response) => responseCourseLabel(response, question) === course,
  );
}

/** Trecho seguro para o nome do arquivo CSV filtrado. */
export function courseFileSlug(course: string): string {
  const slug = course
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug;
}
