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

export const FORM_STATUSES = ["open", "paused", "closed"] as const;

export type FormStatus = (typeof FORM_STATUSES)[number];

export const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  open: "Aberto",
  paused: "Pausado",
  closed: "Fechado",
};

export const FORM_STATUS_HINTS: Record<FormStatus, string> = {
  open: "O formulário está no ar e recebendo respostas.",
  paused:
    "Pausa temporária: ninguém consegue responder e o aviso diz que a pesquisa volta em breve.",
  closed:
    "Coleta encerrada: o formulário sai do ar e o aviso agradece quem participou.",
};

/** Aviso que substitui o formulário quando a pesquisa não está aberta. */
export const FORM_STATUS_NOTICE: Record<
  Exclude<FormStatus, "open">,
  { title: string; text: string }
> = {
  paused: {
    title: "A pesquisa está pausada",
    text: "Estamos organizando as respostas recebidas até aqui. Volte em breve para participar.",
  },
  closed: {
    title: "A pesquisa foi encerrada",
    text: "Obrigado a quem participou. Os resultados vão orientar as próximas ações do projeto.",
  },
};

export function questionsRevision(questions: { id: string }[]): string {
  return questions.map((question) => question.id).join("|");
}

export function isFormStatus(value: unknown): value is FormStatus {
  return FORM_STATUSES.includes(value as FormStatus);
}

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
  /** Respostas antigas ainda podem ter nome; as novas chegam vazias. */
  name: string;
  email: string;
  answers: Answers;
};

export type FormPayload = {
  answers: Answers;
};

export const ANONYMOUS_LABEL = "Resposta anônima";

export function responseTitle(response: { name: string }): string {
  return response.name.trim() || ANONYMOUS_LABEL;
}

export function responseInitial(response: { name: string }): string {
  const name = response.name.trim();
  return name ? name.charAt(0).toUpperCase() : "A";
}

export const OTHER_CHOICE = "Outro";
