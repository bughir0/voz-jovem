import {
  OTHER_CHOICE,
  type Answer,
  type Answers,
  type Question,
} from "./types";

/** Alternativas exibidas para a pergunta, já considerando "Outro" e derivadas. */
export function optionsFor(question: Question, answers: Answers): string[] {
  if (question.type === "derived") {
    if (!question.sourceQuestionId) return [];
    return answers[question.sourceQuestionId]?.choices ?? [];
  }
  return question.allowOther
    ? [...question.options, OTHER_CHOICE]
    : question.options;
}

/**
 * Numa pergunta derivada o rótulo de "Outro" mostra o texto escrito na pergunta
 * de origem, para a pessoa reconhecer o que ela mesma respondeu.
 */
export function labelFor(
  question: Question,
  option: string,
  answers: Answers,
): string {
  if (option !== OTHER_CHOICE) return option;
  const sourceId =
    question.type === "derived" ? question.sourceQuestionId : question.id;
  const text = sourceId ? answers[sourceId]?.other?.trim() : "";
  return text ? `${OTHER_CHOICE}: ${text}` : OTHER_CHOICE;
}

export function scaleValues(question: Question): number[] {
  const min = Math.min(question.scaleMin, question.scaleMax);
  const max = Math.max(question.scaleMin, question.scaleMax);
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

export function isAnswerEmpty(question: Question, answer?: Answer): boolean {
  if (!answer) return true;
  switch (question.type) {
    case "scale":
      return typeof answer.number !== "number";
    case "text":
      return !answer.text?.trim();
    default:
      return (answer.choices ?? []).length === 0;
  }
}

/**
 * Uma pergunta derivada só faz sentido quando a de origem existe e foi
 * respondida; fora disso ela é ignorada no formulário.
 */
export function isQuestionApplicable(
  question: Question,
  questions: Question[],
  answers: Answers,
): boolean {
  if (question.type !== "derived") return true;
  const source = questions.find(
    (item) => item.id === question.sourceQuestionId && !item.archived,
  );
  if (!source) return false;
  return (answers[source.id]?.choices ?? []).length > 0;
}

/** Mensagem de erro, ou null quando a resposta está válida. */
export function validateAnswer(
  question: Question,
  answer: Answer | undefined,
  answers: Answers,
): string | null {
  const empty = isAnswerEmpty(question, answer);

  if (empty) {
    if (!question.required) return null;
    switch (question.type) {
      case "scale":
        return `Escolha um valor de ${question.scaleMin} a ${question.scaleMax}.`;
      case "text":
        return "Escreva sua resposta para continuar.";
      case "multiple":
        return question.maxChoices && question.maxChoices > 1
          ? `Marque pelo menos 1 opção (até ${question.maxChoices}).`
          : "Marque pelo menos 1 opção.";
      default:
        return "Escolha uma opção.";
    }
  }

  const allowed = optionsFor(question, answers);

  if (question.type === "scale") {
    const value = answer?.number;
    if (!scaleValues(question).includes(value as number)) {
      return `Escolha um valor de ${question.scaleMin} a ${question.scaleMax}.`;
    }
    return null;
  }

  if (question.type === "text") return null;

  const choices = answer?.choices ?? [];

  if (choices.some((choice) => !allowed.includes(choice))) {
    return "Alguma alternativa marcada não existe mais nesta pergunta.";
  }

  if (question.type === "multiple") {
    const limit = question.maxChoices ?? allowed.length;
    if (choices.length > limit) {
      return `Marque no máximo ${limit} ${limit === 1 ? "opção" : "opções"}.`;
    }
  } else if (choices.length > 1) {
    return "Escolha apenas uma alternativa.";
  }

  const needsOther =
    choices.includes(OTHER_CHOICE) &&
    (question.type === "single" || question.type === "multiple");
  if (needsOther && !answer?.other?.trim()) {
    return "Descreva a sua resposta no campo “Outro”.";
  }

  return null;
}

/**
 * Texto da resposta pronto para exibir. No painel o texto de "Outro" vem junto
 * da alternativa; no CSV ele fica em coluna própria, então `withOtherText`
 * permite manter a célula com o rótulo puro e contável.
 */
export function formatAnswer(
  question: Question,
  answer: Answer | undefined,
  options?: { withOtherText?: boolean },
): string {
  if (!answer) return "";
  const withOtherText = options?.withOtherText ?? true;

  switch (question.type) {
    case "scale":
      return typeof answer.number === "number" ? String(answer.number) : "";
    case "text":
      return answer.text?.trim() ?? "";
    default: {
      const choices = answer.choices ?? [];
      return choices
        .map((choice) =>
          withOtherText && choice === OTHER_CHOICE && answer.other?.trim()
            ? `${OTHER_CHOICE}: ${answer.other.trim()}`
            : choice,
        )
        .join(" | ");
    }
  }
}

export function hasChoices(question: Question): boolean {
  return (
    question.type === "single" ||
    question.type === "multiple" ||
    question.type === "derived"
  );
}
