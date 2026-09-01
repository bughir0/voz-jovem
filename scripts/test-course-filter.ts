import assert from "node:assert/strict";
import {
  ALL_COURSES,
  MISSING_COURSE_LABEL,
  courseFileSlug,
  filterResponsesByCourse,
  findCourseQuestion,
  listCourseOptions,
  responseCourseLabel,
} from "../lib/course-filter";
import { DEFAULT_QUESTION_IDS, DEFAULT_QUESTIONS } from "../lib/default-questions";
import type { StoredResponse } from "../lib/types";

const courseQuestion = DEFAULT_QUESTIONS.find(
  (question) => question.id === DEFAULT_QUESTION_IDS.course,
);
assert.ok(courseQuestion);

function response(
  id: string,
  choices: string[] | undefined,
  other?: string,
): StoredResponse {
  return {
    id,
    createdAt: "2026-09-01T12:00:00.000Z",
    name: "",
    email: "",
    answers: choices
      ? {
          [DEFAULT_QUESTION_IDS.course]: {
            choices,
            ...(other ? { other } : {}),
          },
        }
      : {},
  };
}

const responses = [
  response("a", ["Aprendizagem em vendas"]),
  response("b", ["Aprendizagem em vendas"]),
  response("c", ["Serviços administrativos"]),
  response("d", ["Outro"], "Técnico em enfermagem"),
  response("e", undefined),
];

assert.equal(
  findCourseQuestion(DEFAULT_QUESTIONS)?.id,
  DEFAULT_QUESTION_IDS.course,
);
assert.equal(
  responseCourseLabel(responses[0], courseQuestion),
  "Aprendizagem em vendas",
);
assert.equal(
  responseCourseLabel(responses[3], courseQuestion),
  "Outro: Técnico em enfermagem",
);
assert.equal(responseCourseLabel(responses[4], courseQuestion), MISSING_COURSE_LABEL);

const options = listCourseOptions(responses, courseQuestion);
assert.deepEqual(
  options.map((item) => [item.value, item.count]),
  [
    ["Serviços administrativos", 1],
    ["Aprendizagem em vendas", 2],
    ["Outro: Técnico em enfermagem", 1],
    [MISSING_COURSE_LABEL, 1],
  ],
);

const sales = filterResponsesByCourse(
  responses,
  courseQuestion,
  "Aprendizagem em vendas",
);
assert.deepEqual(
  sales.map((item) => item.id),
  ["a", "b"],
);

assert.equal(
  filterResponsesByCourse(responses, courseQuestion, ALL_COURSES).length,
  5,
);
assert.equal(courseFileSlug("Aprendizagem em vendas"), "aprendizagem-em-vendas");
assert.equal(courseFileSlug("Outro: Técnico em enfermagem"), "outro-tecnico-em-enfermagem");

console.log("ok: filtro por curso");
