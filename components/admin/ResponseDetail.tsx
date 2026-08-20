"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { scaleValues } from "@/lib/question-utils";
import {
  OTHER_CHOICE,
  responseInitial,
  responseTitle,
  type Answer,
  type Question,
  type StoredResponse,
} from "@/lib/types";
import { AlertIcon, SpinnerIcon } from "@/components/icons";

function Block({
  title,
  badge,
  children,
  index,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.05, duration: 0.4 }}
      className="border-b border-line py-5 last:border-b-0"
    >
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-700">
        {title}
        {badge && (
          <span className="rounded-full border border-line px-2 py-0.5 text-[0.62rem] font-medium text-ink-500">
            {badge}
          </span>
        )}
      </p>
      <div className="mt-2.5">{children}</div>
    </motion.div>
  );
}

function Pill({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-block rounded-lg px-3 py-1.5 text-sm font-medium ${
        highlight
          ? "bg-brand-700 text-white"
          : "bg-brand-50 text-brand-800"
      }`}
    >
      {children}
    </span>
  );
}

function AnswerBody({
  question,
  answer,
}: {
  question: Question;
  answer: Answer | undefined;
}) {
  if (!answer) {
    return (
      <span className="text-sm text-ink-400">
        {question.required ? "Sem resposta" : "Não respondeu (opcional)"}
      </span>
    );
  }

  if (question.type === "scale") {
    const value = answer.number ?? 0;
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {scaleValues(question).map((item) => (
            <span
              key={item}
              className={`tnum grid h-9 w-9 place-items-center rounded-lg text-sm font-semibold ${
                item <= value
                  ? "bg-brand-600 text-white"
                  : "bg-brand-50 text-brand-300"
              }`}
            >
              {item}
            </span>
          ))}
        </div>
        <span className="text-sm text-ink-500">
          {value} de {question.scaleMax}
          {value === question.scaleMin && question.scaleMinLabel
            ? ` — ${question.scaleMinLabel}`
            : ""}
          {value === question.scaleMax && question.scaleMaxLabel
            ? ` — ${question.scaleMaxLabel}`
            : ""}
        </span>
      </div>
    );
  }

  if (question.type === "text") {
    return answer.text?.trim() ? (
      <p className="border-l-2 border-line pl-4 text-sm leading-relaxed whitespace-pre-line text-ink-700">
        {answer.text}
      </p>
    ) : (
      <span className="text-sm text-ink-400">
        {question.required ? "Sem resposta" : "Não respondeu (opcional)"}
      </span>
    );
  }

  const choices = answer.choices ?? [];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <Pill key={choice} highlight={question.type === "derived"}>
            {choice}
          </Pill>
        ))}
      </div>
      {choices.includes(OTHER_CHOICE) && answer.other && (
        <p className="mt-2 text-sm text-ink-700">Outro: {answer.other}</p>
      )}
    </>
  );
}

export function ResponseDetail({
  response,
  questions,
}: {
  response: StoredResponse;
  questions: Question[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const active = questions.filter((question) => !question.archived);
  // Perguntas arquivadas aparecem só quando esta pessoa respondeu a elas.
  const archived = questions.filter(
    (question) => question.archived && response.answers[question.id],
  );

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const result = await fetch(`/api/admin/responses/${response.id}`, {
        method: "DELETE",
      });
      if (!result.ok) {
        const body = await result.json().catch(() => null);
        throw new Error(body?.error ?? "Não foi possível excluir.");
      }
      router.push("/admin");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Erro ao excluir.",
      );
      setDeleting(false);
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="card rounded-2xl p-5 sm:p-8"
    >
      <header className="flex flex-wrap items-start gap-4 border-b border-line pb-6">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-50 text-lg font-semibold text-brand-700">
          {responseInitial(response)}
        </span>
        <div className="min-w-[12rem] flex-1">
          <h1 className="display text-2xl text-ink-900">
            {responseTitle(response)}
          </h1>
          {response.email.trim() ? (
            <p className="text-sm text-ink-500">{response.email}</p>
          ) : (
            <p className="text-sm text-ink-500">Sem identificação pessoal</p>
          )}
        </div>
        <p className="text-xs text-ink-400">
          Enviada em{" "}
          {new Date(response.createdAt).toLocaleString("pt-BR", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      </header>

      <div>
        {active.map((question, index) => (
          <Block
            key={question.id}
            title={`${index + 1}. ${question.title}`}
            badge={question.required ? undefined : "opcional"}
            index={index}
          >
            <AnswerBody
              question={question}
              answer={response.answers[question.id]}
            />
          </Block>
        ))}

        {archived.map((question, index) => (
          <Block
            key={question.id}
            title={question.title}
            badge="pergunta arquivada"
            index={active.length + index}
          >
            <AnswerBody
              question={question}
              answer={response.answers[question.id]}
            />
          </Block>
        ))}
      </div>

      <footer className="no-print mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-10 cursor-pointer rounded-lg border border-line px-4 text-xs font-semibold text-ink-700 transition-colors hover:border-line-strong hover:text-brand-700"
        >
          Imprimir / salvar em PDF
        </button>

        {confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-600">
              Excluir esta resposta definitivamente?
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-danger-500 px-4 text-xs font-semibold text-white transition-colors hover:bg-danger-600 disabled:opacity-60"
            >
              {deleting && <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />}
              Sim, excluir
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-9 cursor-pointer rounded-lg px-3 text-xs font-semibold text-ink-500 hover:text-ink-900"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-10 cursor-pointer rounded-lg px-3 text-xs font-semibold text-ink-400 transition-colors hover:text-danger-500"
          >
            Excluir resposta
          </button>
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-danger-500">
            <AlertIcon className="h-4 w-4" />
            {error}
          </p>
        )}
      </footer>
    </motion.article>
  );
}
