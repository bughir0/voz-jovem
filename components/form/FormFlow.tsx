"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isQuestionApplicable, validateAnswer } from "@/lib/question-utils";
import type { Answer, Answers, Question } from "@/lib/types";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SpinnerIcon,
} from "@/components/icons";
import { Hero } from "./Hero";
import { TextField } from "./Field";
import { ProgressBar } from "./ProgressBar";
import { QuestionShell } from "./QuestionShell";
import { QuestionStep } from "./QuestionStep";
import { SuccessScreen } from "./SuccessScreen";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const slide = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -40 : 40 }),
};

function Actions({
  isLast,
  submitting,
  onBack,
  onNext,
}: {
  isLast: boolean;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700 sm:px-4"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Voltar
      </button>

      <motion.button
        type="button"
        onClick={onNext}
        disabled={submitting}
        whileTap={{ scale: 0.98 }}
        className="group ml-auto inline-flex min-h-13 flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-brand-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70 sm:flex-none sm:px-8"
      >
        {submitting ? (
          <>
            <SpinnerIcon className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            {isLast ? "Enviar respostas" : "Continuar"}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </motion.button>
    </div>
  );
}

/** A etapa 0 é a identificação; as seguintes são as perguntas cadastradas. */
export function FormFlow({ questions }: { questions: Question[] }) {
  const [phase, setPhase] = useState<"intro" | "form" | "done">("intro");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [identity, setIdentity] = useState({ name: "", email: "" });
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalSteps = questions.length + 1;

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const questionAt = useCallback(
    (index: number): Question | null =>
      index >= 1 && index <= questions.length ? questions[index - 1] : null,
    [questions],
  );

  const isApplicable = useCallback(
    (index: number, data: Answers) => {
      const question = questionAt(index);
      if (!question) return index === 0;
      return isQuestionApplicable(question, questions, data);
    },
    [questionAt, questions],
  );

  const validate = useCallback(
    (index: number, data: Answers): string | null => {
      if (index === 0) {
        if (identity.name.trim().length < 2) return "Escreva seu nome completo.";
        if (!EMAIL_PATTERN.test(identity.email.trim()))
          return "Digite um e-mail válido, por exemplo: nome@email.com";
        return null;
      }
      const question = questionAt(index);
      if (!question || !isApplicable(index, data)) return null;
      return validateAnswer(question, data[question.id], data);
    },
    [identity.email, identity.name, isApplicable, questionAt],
  );

  const submit = useCallback(
    async (data: Answers) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await fetch("/api/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: identity.name,
            email: identity.email,
            answers: data,
          }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(
            body?.error ?? "Não foi possível enviar sua resposta.",
          );
        }
        setSubmittedName(identity.name);
        setPhase("done");
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Não foi possível enviar sua resposta.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [identity.email, identity.name],
  );

  const goNext = useCallback(
    (data: Answers = answers, from: number = step) => {
      const message = validate(from, data);
      if (message) {
        setError(message);
        return;
      }

      let next = from + 1;
      while (next <= questions.length && !isApplicable(next, data)) next += 1;

      if (next > questions.length) {
        void submit(data);
        return;
      }

      setError(null);
      setDirection(1);
      setStep(next);
    },
    [answers, isApplicable, questions.length, step, submit, validate],
  );

  const goBack = useCallback(() => {
    if (step === 0) {
      setPhase("intro");
      return;
    }
    let previous = step - 1;
    while (previous >= 1 && !isApplicable(previous, answers)) previous -= 1;
    setError(null);
    setDirection(-1);
    setStep(Math.max(previous, 0));
  }, [answers, isApplicable, step]);

  /**
   * Guardar a resposta pode invalidar uma pergunta derivada: se a alternativa
   * escolhida nela saiu da lista de origem, ela precisa ser respondida de novo.
   */
  const merge = useCallback(
    (previous: Answers, question: Question, answer: Answer): Answers => {
      const next: Answers = { ...previous, [question.id]: answer };
      const dependents = questions.filter(
        (item) => item.sourceQuestionId === question.id,
      );

      for (const dependent of dependents) {
        const current = next[dependent.id]?.choices ?? [];
        const stillValid = current.filter((choice) =>
          (answer.choices ?? []).includes(choice),
        );
        if (stillValid.length === current.length) continue;
        if (stillValid.length === 0) {
          delete next[dependent.id];
        } else {
          next[dependent.id] = { ...next[dependent.id], choices: stillValid };
        }
      }

      return next;
    },
    [questions],
  );

  const handleChange = useCallback(
    (question: Question, answer: Answer) => {
      setAnswers((previous) => merge(previous, question, answer));
      setError(null);
    },
    [merge],
  );

  const handlePick = useCallback(
    (question: Question, answer: Answer, index: number) => {
      const next = merge(answers, question, answer);
      setAnswers(next);
      setError(null);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => goNext(next, index), 360);
    },
    [answers, goNext, merge],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter") return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "TEXTAREA" || target?.tagName === "BUTTON")
        return;
      event.preventDefault();
      if (phase === "intro") {
        setPhase("form");
      } else if (phase === "form" && !submitting) {
        goNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, phase, submitting]);

  const restart = useCallback(() => {
    setAnswers({});
    setIdentity({ name: "", email: "" });
    setStep(0);
    setDirection(1);
    setError(null);
    setPhase("intro");
  }, []);

  const current = questionAt(step);
  const isLast = useMemo(() => {
    for (let index = step + 1; index <= questions.length; index += 1) {
      if (isApplicable(index, answers)) return false;
    }
    return true;
  }, [answers, isApplicable, questions.length, step]);

  if (phase === "done") {
    return <SuccessScreen name={submittedName} onRestart={restart} />;
  }

  if (phase === "intro") {
    return <Hero onStart={() => setPhase("form")} total={questions.length} />;
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto w-full max-w-2xl px-4 py-3 sm:px-6 sm:py-4">
          <ProgressBar
            current={step + 1}
            total={totalSteps}
            label={
              step === 0
                ? "Identificação"
                : `Pergunta ${step} de ${questions.length}`
            }
            onSelect={(index) => {
              setDirection(-1);
              setStep(index);
              setError(null);
            }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pt-6 pb-36 sm:px-6 sm:pt-10 sm:pb-16">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 170, damping: 24 }}
          className="card rounded-2xl p-5 sm:p-8"
        >
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 ? (
                <QuestionShell
                  number={1}
                  total={totalSteps}
                  title="Antes de começar, quem é você?"
                  hint="Nome e e-mail são obrigatórios e ficam visíveis apenas para a organização da pesquisa."
                >
                  <div className="space-y-4">
                    <TextField
                      label="Nome completo"
                      value={identity.name}
                      onChange={(value) => {
                        setIdentity((prev) => ({ ...prev, name: value }));
                        setError(null);
                      }}
                      placeholder="Ex.: Maria Oliveira"
                      autoFocus
                    />
                    <TextField
                      label="E-mail"
                      type="email"
                      value={identity.email}
                      onChange={(value) => {
                        setIdentity((prev) => ({ ...prev, email: value }));
                        setError(null);
                      }}
                      placeholder="Ex.: maria@email.com"
                    />
                  </div>
                </QuestionShell>
              ) : (
                current && (
                  <QuestionStep
                    question={current}
                    number={step + 1}
                    total={totalSteps}
                    answers={answers}
                    answer={answers[current.id]}
                    onChange={(answer) => handleChange(current, answer)}
                    onPick={(answer) => handlePick(current, answer, step)}
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="mt-5 flex items-start gap-2 rounded-lg border border-danger-500/25 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-6 hidden sm:block">
          <Actions
            isLast={isLast}
            submitting={submitting}
            onBack={goBack}
            onNext={() => goNext()}
          />
        </div>
      </main>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 backdrop-blur sm:hidden">
        <Actions
          isLast={isLast}
          submitting={submitting}
          onBack={goBack}
          onNext={() => goNext()}
        />
      </div>
    </div>
  );
}
