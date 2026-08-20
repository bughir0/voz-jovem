import type { Question } from "./types";

/**
 * Perguntas com que a pesquisa começa. Os identificadores são fixos porque a
 * migração do banco antigo aponta para eles. Depois de criadas, todas podem ser
 * editadas, reordenadas ou arquivadas pelo painel.
 */
export const DEFAULT_QUESTION_IDS = {
  ageRange: "q-faixa-etaria",
  occupation: "q-ocupacao",
  problems: "q-problemas",
  mainProblem: "q-problema-principal",
  affected: "q-afetado",
  severity: "q-gravidade",
  enoughActions: "q-acoes-comunidade",
  suggestion: "q-sugestao",
  participate: "q-participacao",
} as const;

const base = {
  hint: null,
  required: true,
  options: [] as string[],
  allowOther: false,
  maxChoices: null,
  scaleMin: 1,
  scaleMax: 5,
  scaleMinLabel: null,
  scaleMaxLabel: null,
  sourceQuestionId: null,
  archived: false,
};

export const DEFAULT_QUESTIONS: Question[] = [
  {
    ...base,
    id: DEFAULT_QUESTION_IDS.ageRange,
    position: 1,
    type: "single",
    title: "Qual é a sua faixa etária?",
    options: [
      "Até 14 anos",
      "15 a 17 anos",
      "18 a 21 anos",
      "22 a 24 anos",
      "25 anos ou mais",
    ],
  },
  {
    ...base,
    id: DEFAULT_QUESTION_IDS.occupation,
    position: 2,
    type: "single",
    title: "Atualmente você:",
    options: [
      "Estuda",
      "Trabalha",
      "Estuda e trabalha",
      "Não estudo nem trabalho atualmente",
    ],
    allowOther: true,
  },
  {
    ...base,
    id: DEFAULT_QUESTION_IDS.problems,
    position: 3,
    type: "multiple",
    title:
      "Na sua opinião, quais problemas mais afetam os jovens atualmente?",
    hint: "Marque até 3 opções.",
    maxChoices: 3,
    allowOther: true,
    options: [
      "Falta de oportunidades de emprego",
      "Dificuldade para conseguir o primeiro emprego",
      "Falta de qualificação profissional",
      "Problemas financeiros",
      "Bullying",
      "Violência",
      "Preconceito/discriminação",
      "Pressão social e cobranças",
      "Solidão/isolamento social",
      "Uso excessivo de celular e redes sociais",
      "Vício em jogos/apostas",
      "Falta de espaços de lazer, esporte e cultura",
      "Desinformação/fake news",
      "Dificuldade nos estudos",
      "Abandono/evasão escolar",
      "Falta de perspectiva para o futuro",
      "Problemas ambientais no bairro/comunidade",
    ],
  },
  {
    ...base,
    id: DEFAULT_QUESTION_IDS.mainProblem,
    position: 4,
    type: "derived",
    title: "Dentre os problemas que você marcou, qual é o MAIS preocupante?",
    hint: "Apenas uma resposta. É ela que define a prioridade do projeto.",
    sourceQuestionId: DEFAULT_QUESTION_IDS.problems,
  },
  {
    ...base,
    id: DEFAULT_QUESTION_IDS.affected,
    position: 5,
    type: "single",
    title: "Você já foi afetado diretamente por esse problema?",
    options: ["Sim", "Não", "Prefiro não responder"],
  },
  {
    ...base,
    id: DEFAULT_QUESTION_IDS.severity,
    position: 6,
    type: "scale",
    title:
      "Quanto você acredita que esse problema prejudica a vida dos jovens?",
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: "Muito pouco",
    scaleMaxLabel: "Muito",
  },
  {
    ...base,
    id: DEFAULT_QUESTION_IDS.enoughActions,
    position: 7,
    type: "single",
    title:
      "Você acredita que existem ações suficientes para enfrentar esse problema na sua comunidade?",
    options: ["Sim", "Parcialmente", "Não", "Não sei"],
  },
  {
    ...base,
    id: DEFAULT_QUESTION_IDS.suggestion,
    position: 8,
    type: "text",
    title:
      "O que você acha que poderia ser feito para melhorar essa situação?",
    hint: "Resposta livre. Se preferir, pode deixar em branco e continuar.",
    required: false,
  },
  {
    ...base,
    id: DEFAULT_QUESTION_IDS.participate,
    position: 9,
    type: "single",
    title:
      "Se existisse um projeto para ajudar a enfrentar esse problema, você participaria?",
    options: ["Sim", "Talvez", "Não"],
  },
];
