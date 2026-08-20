"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { scaleValues } from "@/lib/question-utils";
import {
  OTHER_CHOICE,
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.06, duration: 0.45 }}
      className="border-b border-brand-100 py-4 last:border-b-0"
    >
      <p className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wide text-ink-500 uppercase">
        {title}
        {badge && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[0.62rem] font-bold tracking-normal text-ink-500 normal-case">
            {badge}
          </span>
        )}
      </p>
      <div className="mt-2 text-[0.95rem] font-semibold text-ink-900">
        {children}
      </div>
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
  return highlight ? (
    <span className="inline-block rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-2 text-sm font-bold text-white">
      {children}
    </span>
  ) : (
    <span className="inline-block rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700">
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
      <span className="text-sm font-semibold text-ink-300">
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
              className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-black ${
                item <= value
                  ? "bg-gradient-to-br from-brand-500 to-accent-500 text-white"
                  : "bg-brand-50 text-brand-200"
              }`}
            >
              {item}
            </span>
          ))}
        </div>
        <span className="text-sm font-bold text-ink-500">
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
      <p className="rounded-2xl border border-brand-100 bg-white/70 p-4 text-sm leading-relaxed font-normal whitespace-pre-line text-ink-700">
        {answer.text}
      </p>
    ) : (
      <span className="text-sm font-semibold text-ink-300">
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
        <p className="mt-2 text-sm font-normal text-ink-700">
          Outro: {answer.other}
        </p>
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
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card rounded-[1.75rem] p-6 sm:p-9"
    >
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-xl font-black text-white">
          {response.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight text-ink-900">
            {response.name}
          </h1>
          <p className="text-sm text-ink-500">{response.email}</p>
        </div>
        <p className="text-xs font-semibold text-ink-300">
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

      <footer className="no-print mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="cursor-pointer rounded-full border-2 border-brand-200 bg-white/70 px-5 py-2.5 text-xs font-bold text-brand-600 transition-colors hover:border-brand-400"
        >
          Imprimir / salvar em PDF
        </button>

        {confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink-500">
              Excluir esta resposta definitivamente?
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {deleting && <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />}
              Sim, excluir
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="cursor-pointer rounded-full px-3 py-2 text-xs font-bold text-ink-500 hover:text-ink-900"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="cursor-pointer rounded-full px-4 py-2.5 text-xs font-bold text-ink-300 transition-colors hover:text-accent-500"
          >
            Excluir resposta
          </button>
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-accent-500">
            <AlertIcon className="h-4 w-4" />
            {error}
          </p>
        )}
      </footer>
    </motion.article>
  );
}
