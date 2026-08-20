const BASE = "http://localhost:3000";
let cookie = "";

async function call(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(init.headers ?? {}),
    },
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];

  const type = response.headers.get("content-type") ?? "";
  const body = type.includes("json")
    ? await response.json().catch(() => null)
    : await response.text();

  return { status: response.status, body };
}

function show(label, result) {
  const detail =
    typeof result.body === "string"
      ? `${result.body.slice(0, 120).replace(/\r?\n/g, " ⏎ ")}`
      : JSON.stringify(result.body).slice(0, 220);
  console.log(`${result.status === 200 || result.status === 201 ? "OK " : "!! "}${label} → ${result.status} ${detail}`);
  return result;
}

const login = show(
  "login admin",
  await call("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD ?? "admin123" }),
  }),
);
if (login.status !== 200) process.exit(1);

show("listar perguntas", await call("/api/admin/questions"));

const created = show(
  "criar pergunta de escala",
  await call("/api/admin/questions", {
    method: "POST",
    body: JSON.stringify({
      type: "scale",
      title: "Como você avalia o transporte público do seu bairro?",
      hint: "Teste automatizado",
      required: true,
      scaleMin: 1,
      scaleMax: 4,
      scaleMinLabel: "Ruim",
      scaleMaxLabel: "Ótimo",
    }),
  }),
);
const scaleId = created.body?.question?.id;

const extra = show(
  "criar pergunta de escolha única",
  await call("/api/admin/questions", {
    method: "POST",
    body: JSON.stringify({
      type: "single",
      title: "Você usa transporte público para estudar ou trabalhar?",
      required: true,
      options: ["Sim, todos os dias", "Às vezes", "Não uso"],
      allowOther: true,
    }),
  }),
);
const singleId = extra.body?.question?.id;

show(
  "editar pergunta de escala",
  await call(`/api/admin/questions/${scaleId}`, {
    method: "PATCH",
    body: JSON.stringify({
      type: "scale",
      title: "Como você avalia o transporte público do seu bairro?",
      hint: "Considere os últimos 6 meses.",
      required: true,
      scaleMin: 1,
      scaleMax: 5,
      scaleMinLabel: "Ruim",
      scaleMaxLabel: "Ótimo",
    }),
  }),
);

show(
  "recusar pergunta sem alternativas suficientes",
  await call("/api/admin/questions", {
    method: "POST",
    body: JSON.stringify({
      type: "single",
      title: "Pergunta inválida de teste",
      options: ["Só uma"],
    }),
  }),
);

const all = await call("/api/admin/questions");
const activeIds = all.body.questions
  .filter((question) => !question.archived)
  .map((question) => question.id);

const reordered = [
  ...activeIds.filter((id) => id !== scaleId).slice(0, 2),
  scaleId,
  ...activeIds.filter((id) => id !== scaleId).slice(2),
];
show(
  "reordenar (escala vira a 3ª)",
  await call("/api/admin/questions/reorder", {
    method: "POST",
    body: JSON.stringify({ ids: reordered }),
  }),
);

show(
  "remover pergunta sem respostas",
  await call(`/api/admin/questions/${singleId}`, { method: "DELETE" }),
);

// Envia uma resposta completa usando as perguntas publicadas agora.
const current = (await call("/api/admin/questions")).body.questions.filter(
  (question) => !question.archived,
);

const answers = {};
for (const question of current) {
  if (question.type === "scale") {
    answers[question.id] = { number: question.scaleMax };
  } else if (question.type === "text") {
    answers[question.id] = { text: "Resposta de teste automatizado." };
  } else if (question.type === "multiple") {
    answers[question.id] = {
      choices: question.options.slice(0, question.maxChoices ?? 1),
    };
  } else if (question.type === "derived") {
    const source = current.find((item) => item.id === question.sourceQuestionId);
    answers[question.id] = { choices: [answers[source.id].choices[0]] };
  } else {
    answers[question.id] = { choices: [question.options[0]] };
  }
}

show(
  "enviar resposta com as perguntas novas",
  await call("/api/responses", {
    method: "POST",
    body: JSON.stringify({
      name: "Teste Automatizado",
      email: "teste.auto@email.com",
      answers,
    }),
  }),
);

show(
  "recusar resposta incompleta",
  await call("/api/responses", {
    method: "POST",
    body: JSON.stringify({
      name: "Teste Incompleto",
      email: "incompleto@email.com",
      answers: {},
    }),
  }),
);

show(
  "arquivar pergunta que já tem resposta",
  await call(`/api/admin/questions/${scaleId}`, { method: "DELETE" }),
);

show(
  "bloquear remoção da origem de uma derivada",
  await call(
    `/api/admin/questions/${current.find((q) => q.type === "multiple").id}`,
    { method: "DELETE" },
  ),
);

const csv = await call("/api/admin/export");
const lines = String(csv.body).split("\r\n");
console.log(`OK csv → ${csv.status} ${lines.length} linhas`);
console.log(`   cabeçalho: ${lines[0].slice(0, 400)}`);

show(
  "restaurar pergunta arquivada",
  await call(`/api/admin/questions/${scaleId}`, {
    method: "PATCH",
    body: JSON.stringify({ archived: false }),
  }),
);
