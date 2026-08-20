export const QUESTION_TYPES = [
  "single",
  "multiple",
  "scale",
  "text",
  "derived",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single: "Escolha única",
  multiple: "Múltipla escolha",
  scale: "Escala numérica",
  text: "Texto livre",
  derived: "Derivada de outra pergunta",
};

export const QUESTION_TYPE_HINTS: Record<QuestionType, string> = {
  single: "A pessoa marca apenas uma alternativa.",
  multiple: "A pessoa pode marcar várias alternativas, até o limite definido.",
  scale: "A pessoa escolhe um número dentro de um intervalo.",
  text: "A pessoa escreve a resposta com as próprias palavras.",
  derived:
    "As alternativas são as que a pessoa marcou em uma pergunta de múltipla escolha, aceitando só uma resposta.",
};

export type Question = {
  id: string;
  position: number;
  type: QuestionType;
  title: string;
  hint: string | null;
  required: boolean;
  options: string[];
  allowOther: boolean;
  maxChoices: number | null;
  scaleMin: number;
  scaleMax: number;
  scaleMinLabel: string | null;
  scaleMaxLabel: string | null;
  sourceQuestionId: string | null;
  archived: boolean;
};

/** Campos que o painel envia ao criar ou editar uma pergunta. */
export type QuestionInput = {
  type: QuestionType;
  title: string;
  hint: string | null;
  required: boolean;
  options: string[];
  allowOther: boolean;
  maxChoices: number | null;
  scaleMin: number;
  scaleMax: number;
  scaleMinLabel: string | null;
  scaleMaxLabel: string | null;
  sourceQuestionId: string | null;
};

/**
 * Uma resposta guarda `choices` para os tipos de alternativa, `number` para
 * escala e `text` para resposta aberta. `other` carrega o texto de "Outro".
 */
export type Answer = {
  choices?: string[];
  number?: number;
  text?: string;
  other?: string;
};

export type Answers = Record<string, Answer>;

export type StoredResponse = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  answers: Answers;
};

export type FormPayload = {
  name: string;
  email: string;
  answers: Answers;
};

export const OTHER_CHOICE = "Outro";
