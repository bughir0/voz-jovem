import {
  QUESTION_TYPES,
  type Question,
  type QuestionInput,
  type QuestionType,
} from "./types";

export const MAX_OPTIONS = 40;
export const MAX_SCALE_POINTS = 11;

function text(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

/**
 * Valida o que o painel enviou. Retorna a pergunta pronta para gravar ou uma
 * mensagem de erro em português para mostrar no formulário.
 */
export function parseQuestionInput(
  raw: unknown,
  questions: Question[],
  selfId?: string,
): { input: QuestionInput } | { error: string } {
  const body = (raw ?? {}) as Record<string, unknown>;

  const type = String(body.type ?? "") as QuestionType;
  if (!QUESTION_TYPES.includes(type)) {
    return { error: "Escolha um tipo de pergunta válido." };
  }

  const title = text(body.title, 300);
  if (title.length < 3) {
    return { error: "Escreva o enunciado da pergunta (mínimo 3 letras)." };
  }

  const hint = text(body.hint, 300);

  const hasOptions = type === "single" || type === "multiple";
  let options: string[] = [];

  if (hasOptions) {
    const list = Array.isArray(body.options) ? body.options : [];
    options = Array.from(
      new Set(
        list
          .map((item) => text(item, 200))
          .filter((item) => item.length > 0),
      ),
    ).slice(0, MAX_OPTIONS);

    if (options.length < 2) {
      return { error: "Cadastre pelo menos 2 alternativas." };
    }
  }

  const allowOther = hasOptions && body.allowOther === true;

  let maxChoices: number | null = null;
  if (type === "multiple") {
    const total = options.length + (allowOther ? 1 : 0);
    const value = Number(body.maxChoices);
    if (!Number.isInteger(value) || value < 1) {
      return { error: "Informe quantas alternativas podem ser marcadas." };
    }
    maxChoices = Math.min(value, total);
  }

  let scaleMin = 1;
  let scaleMax = 5;
  let scaleMinLabel: string | null = null;
  let scaleMaxLabel: string | null = null;

  if (type === "scale") {
    scaleMin = Number(body.scaleMin);
    scaleMax = Number(body.scaleMax);
    if (!Number.isInteger(scaleMin) || !Number.isInteger(scaleMax)) {
      return { error: "Os limites da escala precisam ser números inteiros." };
    }
    if (scaleMax <= scaleMin) {
      return { error: "O maior valor da escala precisa ser maior que o menor." };
    }
    if (scaleMax - scaleMin + 1 > MAX_SCALE_POINTS) {
      return {
        error: `A escala pode ter no máximo ${MAX_SCALE_POINTS} valores.`,
      };
    }
    scaleMinLabel = text(body.scaleMinLabel, 60) || null;
    scaleMaxLabel = text(body.scaleMaxLabel, 60) || null;
  }

  let sourceQuestionId: string | null = null;
  if (type === "derived") {
    sourceQuestionId = text(body.sourceQuestionId, 80) || null;
    if (!sourceQuestionId) {
      return { error: "Escolha a pergunta de origem das alternativas." };
    }
    if (sourceQuestionId === selfId) {
      return { error: "A pergunta não pode derivar de si mesma." };
    }
    const source = questions.find((item) => item.id === sourceQuestionId);
    if (!source || source.archived) {
      return { error: "A pergunta de origem escolhida não está disponível." };
    }
    if (source.type !== "multiple") {
      return {
        error: "A origem precisa ser uma pergunta de múltipla escolha.",
      };
    }
  }

  return {
    input: {
      type,
      title,
      hint: hint || null,
      required: body.required !== false,
      options,
      allowOther,
      maxChoices,
      scaleMin,
      scaleMax,
      scaleMinLabel,
      scaleMaxLabel,
      sourceQuestionId,
    },
  };
}
