import { createClient } from "@libsql/client";
import path from "node:path";

const client = createClient({
  url: `file:${path.resolve("data/voz-jovem.db")}`,
});

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
);
console.log("TABELAS:", tables.rows.map((row) => row.name).join(", "));

const questions = await client.execute(
  "SELECT position, type, title, archived FROM questions ORDER BY position",
);
console.log("PERGUNTAS:", questions.rows.length);
for (const row of questions.rows) {
  console.log(
    `  ${row.position} [${row.type}] ${String(row.title).slice(0, 50)}`,
  );
}

const responses = await client.execute(
  "SELECT name, answers FROM survey_responses",
);
console.log("RESPOSTAS:", responses.rows.length);
for (const row of responses.rows) {
  console.log(`  ${row.name}: ${String(row.answers).slice(0, 260)}`);
}
