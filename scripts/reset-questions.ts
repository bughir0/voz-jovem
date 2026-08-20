/**
 * Substitui as perguntas do banco pelas de `lib/default-questions.ts`.
 *
 * Uso: node scripts/reset-questions.ts
 *
 * As respostas já recebidas não são tocadas, mas perguntas que saem da lista
 * deixam de aparecer nos relatórios — por isso o script recusa rodar quando já
 * existem respostas, a menos que receba --force.
 */
import { createClient } from "@libsql/client";
import path from "node:path";
import { DEFAULT_QUESTIONS } from "../lib/default-questions.ts";

const force = process.argv.includes("--force");
const url = process.env.DATABASE_URL?.trim();

const client = createClient(
  url && !url.startsWith("file:")
    ? { url, authToken: process.env.DATABASE_AUTH_TOKEN }
    : {
        url: `file:${path.resolve(
          url ? url.slice("file:".length) : "data/voz-jovem.db",
        )}`,
      },
);

const responses = await client.execute(
  "SELECT COUNT(*) AS total FROM survey_responses",
);
const total = Number(responses.rows[0]?.total ?? 0);

if (total > 0 && !force) {
  console.error(
    `O banco tem ${total} resposta(s). Rode com --force se quiser trocar as perguntas mesmo assim.`,
  );
  process.exit(1);
}

await client.execute("DELETE FROM questions");

for (const question of DEFAULT_QUESTIONS) {
  await client.execute({
    sql: `INSERT INTO questions (
            id, position, type, title, hint, required, options, allow_other,
            max_choices, scale_min, scale_max, scale_min_label, scale_max_label,
            source_question_id, archived
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      question.id,
      question.position,
      question.type,
      question.title,
      question.hint,
      question.required ? 1 : 0,
      JSON.stringify(question.options),
      question.allowOther ? 1 : 0,
      question.maxChoices,
      question.scaleMin,
      question.scaleMax,
      question.scaleMinLabel,
      question.scaleMaxLabel,
      question.sourceQuestionId,
      question.archived ? 1 : 0,
    ],
  });
}

console.log(`${DEFAULT_QUESTIONS.length} perguntas gravadas.`);
