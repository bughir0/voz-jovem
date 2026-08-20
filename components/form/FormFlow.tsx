"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isQuestionApplicable, validateAnswer } from "@/lib/question-utils";
import type { Answer, Answers, Question } from "@/lib/types";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SparkIcon,
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
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 70 : -70,
    filter: "blur(6px)",
  }),
  center: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -70 : 70,
    filter: "blur(6px)",
  }),
};

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
    return (
      <Hero onStart={() => setPhase("form")} total={questions.length} />
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-24 sm:px-6 sm:pt-10">
      <header className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
          <SparkIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <ProgressBar
            current={step + 1}
            total={totalSteps}
            label={
              step === 0
                ? "Identificação"
                : `Pergunta ${step} de ${questions.length}`
            }
          />
        </div>
      </header>

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 150, damping: 22 }}
        className="glass-card rounded-[1.75rem] p-6 sm:p-9"
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
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
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="mt-5 flex items-center gap-2 rounded-xl bg-accent-500/10 px-4 py-3 text-sm font-semibold text-accent-500"
            >
              <AlertIcon className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3">
          <motion.button
            type="button"
            onClick={goBack}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar
          </motion.button>

          <motion.button
            type="button"
            onClick={() => goNext()}
            disabled={submitting}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 px-7 py-3.5 text-sm font-bold text-white shadow-glow disabled:cursor-wait disabled:opacity-70"
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
      </motion.div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
        {Array.from({ length: totalSteps }, (_, index) => (
          <motion.button
            key={index}
            type="button"
            onClick={() => {
              if (index < step) {
                setDirection(-1);
                setStep(index);
                setError(null);
              }
            }}
            animate={{
              width: index === step ? 26 : 8,
              opacity: index <= step ? 1 : 0.4,
            }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className={`h-2 rounded-full ${
              index <= step
                ? "cursor-pointer bg-gradient-to-r from-brand-500 to-accent-500"
                : "cursor-default bg-brand-200"
            }`}
            aria-label={
              index === 0 ? "Identificação" : `Pergunta ${index}`
            }
          />
        ))}
      </div>
    </div>
  );
}
