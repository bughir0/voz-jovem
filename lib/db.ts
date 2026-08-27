import { createClient, type Client, type Row } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_QUESTIONS, DEFAULT_QUESTION_IDS } from "./default-questions";
import {
  isFormStatus,
  questionsRevision,
  type Answers,
  type FormStatus,
  type Question,
  type QuestionInput,
  type StoredResponse,
} from "./types";

const DATABASE_URL =
  process.env.DATABASE_URL?.trim() || "file:./data/voz-jovem.db";

function buildClient(): Client {
  if (DATABASE_URL.startsWith("file:")) {
    // Na Vercel o disco é somente leitura e some a cada requisição, então um
    // banco em arquivo perderia todas as respostas sem avisar.
    if (process.env.VERCEL) {
      throw new Error(
        "DATABASE_URL aponta para um arquivo local, o que não funciona na Vercel. " +
          "Configure a URL libSQL do Turso (libsql://...) e o DATABASE_AUTH_TOKEN.",
      );
    }

    // O caminho vem de variável de ambiente; o turbopackIgnore evita que o
    // bundler inclua todo o projeto no rastreamento de arquivos.
    const relative = DATABASE_URL.slice("file:".length);
    const absolute = path.resolve(
      /* turbopackIgnore: true */ process.cwd(),
      relative,
    );
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    return createClient({ url: `file:${absolute}` });
  }
  return createClient({
    url: DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

const SCHEMA_QUESTIONS = `
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  hint TEXT,
  required INTEGER NOT NULL DEFAULT 1,
  options TEXT NOT NULL DEFAULT '[]',
  allow_other INTEGER NOT NULL DEFAULT 0,
  max_choices INTEGER,
  scale_min INTEGER NOT NULL DEFAULT 1,
  scale_max INTEGER NOT NULL DEFAULT 5,
  scale_min_label TEXT,
  scale_max_label TEXT,
  source_question_id TEXT,
  archived INTEGER NOT NULL DEFAULT 0
)`;

const SCHEMA_RESPONSES = `
CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  answers TEXT NOT NULL
)`;

const SCHEMA_SETTINGS = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`;

const SCHEMA_SUBMIT_KEYS = `
CREATE TABLE IF NOT EXISTS submit_keys (
  key TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
)`;

// O módulo é reavaliado a cada hot-reload do Next em desenvolvimento; guardar a
// conexão no globalThis evita abrir dezenas de handles no mesmo arquivo SQLite.
// O sufixo de versão descarta conexões antigas quando o esquema muda.
const cache = globalThis as unknown as { __vozJovemDbV5?: Promise<Client> };

function connect(): Promise<Client> {
  if (!cache.__vozJovemDbV5) {
    cache.__vozJovemDbV5 = (async () => {
      const client = buildClient();
      await client.execute(SCHEMA_QUESTIONS);
      await client.execute(SCHEMA_RESPONSES);
      await client.execute(SCHEMA_SETTINGS);
      await client.execute(SCHEMA_SUBMIT_KEYS);
      await client.execute(
        "CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses (created_at DESC)",
      );
      await seedQuestions(client);
      await migrateLegacyResponses(client);
      return client;
    })();
  }
  return cache.__vozJovemDbV5;
}

async function seedQuestions(client: Client): Promise<void> {
  const existing = await client.execute("SELECT id FROM questions");
  const ids = new Set(existing.rows.map((row) => String(row.id)));

  if (ids.size === 0) {
    for (const question of DEFAULT_QUESTIONS) {
      await insertQuestionRow(client, question);
    }
    return;
  }

  for (const question of DEFAULT_QUESTIONS) {
    if (ids.has(question.id)) continue;
    await client.execute({
      sql: "UPDATE questions SET position = position + 1 WHERE position >= ?",
      args: [question.position],
    });
    await insertQuestionRow(client, question);
    ids.add(question.id);
  }
}

/**
 * A primeira versão do projeto guardava cada pergunta numa coluna própria da
 * tabela `responses`. Aqui essas linhas viram respostas no formato novo e a
 * tabela antiga é preservada como `responses_legacy`.
 */
async function migrateLegacyResponses(client: Client): Promise<void> {
  const info = await client.execute("PRAGMA table_info(responses)");
  const isLegacy = info.rows.some((row) => String(row.name) === "age_range");
  if (!isLegacy) return;

  const migrated = await client.execute(
    "SELECT COUNT(*) AS total FROM survey_responses",
  );
  if (Number(migrated.rows[0]?.total ?? 0) === 0) {
    const legacy = await client.execute("SELECT * FROM responses");

    for (const row of legacy.rows) {
      let problems: string[] = [];
      try {
        const parsed = JSON.parse(String(row.problems ?? "[]"));
        if (Array.isArray(parsed)) problems = parsed.map(String);
      } catch {
        problems = [];
      }

      const answers: Answers = {
        [DEFAULT_QUESTION_IDS.ageRange]: { choices: [String(row.age_range)] },
        [DEFAULT_QUESTION_IDS.occupation]: {
          choices: [String(row.occupation)],
          other: row.occupation_other ? String(row.occupation_other) : undefined,
        },
        [DEFAULT_QUESTION_IDS.problems]: {
          choices: problems,
          other: row.problems_other ? String(row.problems_other) : undefined,
        },
        [DEFAULT_QUESTION_IDS.mainProblem]: {
          choices: [String(row.main_problem)],
        },
        [DEFAULT_QUESTION_IDS.affected]: { choices: [String(row.affected)] },
        [DEFAULT_QUESTION_IDS.severity]: { number: Number(row.severity) },
        [DEFAULT_QUESTION_IDS.enoughActions]: {
          choices: [String(row.enough_actions)],
        },
        [DEFAULT_QUESTION_IDS.suggestion]: {
          text: row.suggestion ? String(row.suggestion) : undefined,
        },
        [DEFAULT_QUESTION_IDS.participate]: {
          choices: [String(row.would_participate)],
        },
      };

      await client.execute({
        sql: `INSERT OR IGNORE INTO survey_responses (id, created_at, name, email, answers)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          String(row.id),
          String(row.created_at),
          String(row.name),
          String(row.email),
          JSON.stringify(answers),
        ],
      });
    }
  }

  await client.execute("ALTER TABLE responses RENAME TO responses_legacy");
}

function toQuestion(row: Row): Question {
  let options: string[] = [];
  try {
    const parsed = JSON.parse(String(row.options ?? "[]"));
    if (Array.isArray(parsed)) options = parsed.map(String);
  } catch {
    options = [];
  }

  return {
    id: String(row.id),
    position: Number(row.position),
    type: String(row.type) as Question["type"],
    title: String(row.title),
    hint: row.hint ? String(row.hint) : null,
    required: Number(row.required) === 1,
    options,
    allowOther: Number(row.allow_other) === 1,
    maxChoices: row.max_choices === null ? null : Number(row.max_choices),
    scaleMin: Number(row.scale_min),
    scaleMax: Number(row.scale_max),
    scaleMinLabel: row.scale_min_label ? String(row.scale_min_label) : null,
    scaleMaxLabel: row.scale_max_label ? String(row.scale_max_label) : null,
    sourceQuestionId: row.source_question_id
      ? String(row.source_question_id)
      : null,
    archived: Number(row.archived) === 1,
  };
}

async function insertQuestionRow(
  client: Client,
  question: Question,
): Promise<void> {
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

export async function listQuestions(options?: {
  includeArchived?: boolean;
}): Promise<Question[]> {
  const db = await connect();
  const result = await db.execute(
    options?.includeArchived
      ? "SELECT * FROM questions ORDER BY archived ASC, position ASC"
      : "SELECT * FROM questions WHERE archived = 0 ORDER BY position ASC",
  );
  return result.rows.map(toQuestion);
}

export async function getQuestion(id: string): Promise<Question | null> {
  const db = await connect();
  const result = await db.execute({
    sql: "SELECT * FROM questions WHERE id = ? LIMIT 1",
    args: [id],
  });
  const row = result.rows[0];
  return row ? toQuestion(row) : null;
}

export async function createQuestion(input: QuestionInput): Promise<Question> {
  const db = await connect();
  const max = await db.execute(
    "SELECT COALESCE(MAX(position), 0) AS last FROM questions",
  );

  const question: Question = {
    ...input,
    id: `q-${crypto.randomUUID().slice(0, 8)}`,
    position: Number(max.rows[0]?.last ?? 0) + 1,
    archived: false,
  };

  await insertQuestionRow(db, question);
  return question;
}

export async function updateQuestion(
  id: string,
  input: QuestionInput,
): Promise<void> {
  const db = await connect();
  await db.execute({
    sql: `UPDATE questions SET
            type = ?, title = ?, hint = ?, required = ?, options = ?,
            allow_other = ?, max_choices = ?, scale_min = ?, scale_max = ?,
            scale_min_label = ?, scale_max_label = ?, source_question_id = ?
          WHERE id = ?`,
    args: [
      input.type,
      input.title,
      input.hint,
      input.required ? 1 : 0,
      JSON.stringify(input.options),
      input.allowOther ? 1 : 0,
      input.maxChoices,
      input.scaleMin,
      input.scaleMax,
      input.scaleMinLabel,
      input.scaleMaxLabel,
      input.sourceQuestionId,
      id,
    ],
  });
}

export async function setQuestionArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  const db = await connect();
  await db.execute({
    sql: "UPDATE questions SET archived = ? WHERE id = ?",
    args: [archived ? 1 : 0, id],
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  const db = await connect();
  await db.execute({ sql: "DELETE FROM questions WHERE id = ?", args: [id] });
}

export async function reorderQuestions(ids: string[]): Promise<void> {
  const db = await connect();
  await db.batch(
    ids.map((id, index) => ({
      sql: "UPDATE questions SET position = ? WHERE id = ?",
      args: [index + 1, id],
    })),
    "write",
  );
}

/** Perguntas derivadas que dependem da pergunta informada. */
export async function findDependentQuestions(id: string): Promise<Question[]> {
  const db = await connect();
  const result = await db.execute({
    sql: "SELECT * FROM questions WHERE source_question_id = ? AND archived = 0",
    args: [id],
  });
  return result.rows.map(toQuestion);
}

function toResponse(row: Row): StoredResponse {
  let answers: Answers = {};
  try {
    const parsed = JSON.parse(String(row.answers ?? "{}"));
    if (parsed && typeof parsed === "object") answers = parsed as Answers;
  } catch {
    answers = {};
  }

  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    name: String(row.name),
    email: String(row.email),
    answers,
  };
}

export async function insertResponse(data: {
  answers: Answers;
}): Promise<StoredResponse> {
  const db = await connect();
  const record: StoredResponse = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: "",
    email: "",
    answers: data.answers,
  };

  await db.execute({
    sql: `INSERT INTO survey_responses (id, created_at, name, email, answers)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      record.id,
      record.createdAt,
      record.name,
      record.email,
      JSON.stringify(record.answers),
    ],
  });

  return record;
}

const SUBMIT_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSubmitKey(value: unknown): value is string {
  return typeof value === "string" && SUBMIT_KEY_PATTERN.test(value);
}

/**
 * Garante que a mesma chave só grave uma resposta. Devolve false quando o
 * envio já foi aceito — o segundo POST (clique duplo, Enter + botão) é
 * ignorado.
 */
export async function claimSubmitKey(key: string): Promise<boolean> {
  const db = await connect();
  const result = await db.execute({
    sql: "INSERT OR IGNORE INTO submit_keys (key, created_at) VALUES (?, ?)",
    args: [key, new Date().toISOString()],
  });
  return result.rowsAffected > 0;
}

export async function listResponses(): Promise<StoredResponse[]> {
  const db = await connect();
  const result = await db.execute(
    "SELECT * FROM survey_responses ORDER BY created_at DESC",
  );
  return result.rows.map(toResponse);
}

export async function getResponse(id: string): Promise<StoredResponse | null> {
  const db = await connect();
  const result = await db.execute({
    sql: "SELECT * FROM survey_responses WHERE id = ? LIMIT 1",
    args: [id],
  });
  const row = result.rows[0];
  return row ? toResponse(row) : null;
}

export async function deleteResponse(id: string): Promise<void> {
  const db = await connect();
  await db.execute({
    sql: "DELETE FROM survey_responses WHERE id = ?",
    args: [id],
  });
}

const FORM_STATUS_KEY = "form_status";

async function readSetting(key: string): Promise<string | null> {
  const db = await connect();
  const result = await db.execute({
    sql: "SELECT value FROM settings WHERE key = ? LIMIT 1",
    args: [key],
  });
  const row = result.rows[0];
  return row ? String(row.value) : null;
}

/** Um banco criado antes desta configuração existir conta como aberto. */
export async function getFormStatus(): Promise<FormStatus> {
  const stored = await readSetting(FORM_STATUS_KEY);
  return isFormStatus(stored) ? stored : "open";
}

export async function getSurveySnapshot(): Promise<{
  status: FormStatus;
  revision: string;
  questions: Question[];
}> {
  const [status, questions] = await Promise.all([
    getFormStatus(),
    listQuestions(),
  ]);
  return { status, questions, revision: questionsRevision(questions) };
}

export async function setFormStatus(status: FormStatus): Promise<void> {
  const db = await connect();
  await db.execute({
    sql: `INSERT INTO settings (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [FORM_STATUS_KEY, status],
  });
}

/** Quantas respostas já guardam algum dado para a pergunta informada. */
export async function countAnswersFor(questionId: string): Promise<number> {
  const responses = await listResponses();
  return responses.filter((response) => {
    const answer = response.answers[questionId];
    if (!answer) return false;
    return (
      (answer.choices?.length ?? 0) > 0 ||
      typeof answer.number === "number" ||
      Boolean(answer.text?.trim())
    );
  }).length;
}
