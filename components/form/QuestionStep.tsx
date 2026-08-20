"use client";

import { AnimatePresence, motion } from "motion/react";
import { labelFor, optionsFor } from "@/lib/question-utils";
import {
  OTHER_CHOICE,
  type Answer,
  type Answers,
  type Question,
} from "@/lib/types";
import { InlineOtherField, TextAreaField } from "./Field";
import { OptionButton } from "./OptionButton";
import { QuestionShell } from "./QuestionShell";
import { ScaleField } from "./ScaleField";

type Props = {
  question: Question;
  number: number;
  total: number;
  answers: Answers;
  answer: Answer | undefined;
  /** Atualiza a resposta e espera o participante clicar em Continuar. */
  onChange: (answer: Answer) => void;
  /** Atualiza a resposta e avança sozinho para a próxima pergunta. */
  onPick: (answer: Answer) => void;
};

export function QuestionStep({
  question,
  number,
  total,
  answers,
  answer,
  onChange,
  onPick,
}: Props) {
  const options = optionsFor(question, answers);
  const choices = answer?.choices ?? [];
  const limit = question.maxChoices ?? options.length;

  function toggle(option: string) {
    const selected = choices.includes(option);
    if (!selected && choices.length >= limit) return;
    const next = selected
      ? choices.filter((item) => item !== option)
      : [...choices, option];
    onChange({
      ...answer,
      choices: next,
      other: next.includes(OTHER_CHOICE) ? answer?.other : undefined,
    });
  }

  return (
    <QuestionShell
      number={number}
      total={total}
      title={question.title}
      hint={question.hint ?? undefined}
      required={question.required}
    >
      {question.type === "text" && (
        <TextAreaField
          value={answer?.text ?? ""}
          onChange={(value) => onChange({ text: value })}
          placeholder="Escreva sua resposta aqui..."
        />
      )}

      {question.type === "scale" && (
        <ScaleField
          question={question}
          value={answer?.number ?? null}
          onChange={(value) => onPick({ number: value })}
        />
      )}

      {question.type === "multiple" && (
        <>
          {question.maxChoices !== null && (
            <div className="mb-4 flex items-center gap-2">
              {Array.from({ length: question.maxChoices }, (_, index) => (
                <motion.span
                  key={index}
                  animate={{
                    scale: index < choices.length ? 1 : 0.75,
                    opacity: index < choices.length ? 1 : 0.35,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`h-2.5 w-8 rounded-full ${
                    index < choices.length
                      ? "bg-gradient-to-r from-brand-500 to-accent-500"
                      : "bg-brand-200"
                  }`}
                />
              ))}
              <span className="ml-1 text-xs font-bold text-ink-500">
                {choices.length} de {question.maxChoices} selecionados
              </span>
            </div>
          )}

          <div className="custom-scroll max-h-[46vh] space-y-2.5 overflow-y-auto pr-2">
            {options.map((option, index) => {
              const selected = choices.includes(option);
              return (
                <div key={option}>
                  <OptionButton
                    label={option}
                    index={index}
                    multiple
                    selected={selected}
                    disabled={!selected && choices.length >= limit}
                    onSelect={() => toggle(option)}
                  />
                  <AnimatePresence>
                    {option === OTHER_CHOICE && selected && (
                      <InlineOtherField
                        value={answer?.other ?? ""}
                        onChange={(value) =>
                          onChange({ ...answer, choices, other: value })
                        }
                        placeholder="Escreva a sua resposta"
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </>
      )}

      {(question.type === "single" || question.type === "derived") && (
        <div className="space-y-2.5">
          {options.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-brand-200 px-4 py-8 text-center text-sm font-semibold text-ink-300">
              Esta pergunta ainda não tem alternativas cadastradas.
            </p>
          ) : (
            options.map((option, index) => {
              const selected = choices.includes(option);
              const isOther = option === OTHER_CHOICE && question.type !== "derived";

              return (
                <div key={option}>
                  <OptionButton
                    label={labelFor(question, option, answers)}
                    index={index}
                    selected={selected}
                    onSelect={() => {
                      // "Outro" precisa do texto antes de avançar.
                      if (isOther) {
                        onChange({ choices: [option], other: answer?.other });
                      } else {
                        onPick({ choices: [option] });
                      }
                    }}
                  />
                  <AnimatePresence>
                    {isOther && selected && (
                      <InlineOtherField
                        value={answer?.other ?? ""}
                        onChange={(value) =>
                          onChange({ choices: [option], other: value })
                        }
                        placeholder="Escreva a sua resposta"
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      )}
    </QuestionShell>
  );
}
