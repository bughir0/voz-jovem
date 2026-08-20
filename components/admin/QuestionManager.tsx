"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertIcon,
  ArchiveIcon,
  ChartIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon,
} from "@/components/icons";
import { QUESTION_TYPE_LABELS, type Question } from "@/lib/types";
import { QuestionForm } from "./QuestionForm";

type Mode = { kind: "none" } | { kind: "new" } | { kind: "edit"; id: string };

const linkButton =
  "inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-xs font-semibold text-ink-700 transition-colors hover:border-line-strong hover:text-brand-700";

function describe(question: Question, questions: Question[]): string {
  switch (question.type) {
    case "text":
      return "Resposta escrita pela pessoa";
    case "scale":
      return `Escala de ${question.scaleMin} a ${question.scaleMax}`;
    case "derived": {
      const source = questions.find(
        (item) => item.id === question.sourceQuestionId,
      );
      return `Alternativas vindas de “${source?.title ?? "pergunta removida"}”`;
    }
    case "multiple": {
      const total = question.options.length + (question.allowOther ? 1 : 0);
      return `${total} alternativas · marca até ${question.maxChoices ?? total}`;
    }
    default: {
      const total = question.options.length + (question.allowOther ? 1 : 0);
      return `${total} alternativas · marca 1`;
    }
  }
}

export function QuestionManager({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: "none" });
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = questions.filter((question) => !question.archived);
  const archived = questions.filter((question) => question.archived);

  function announce(message: string) {
    setNotice(message);
    setError(null);
    window.setTimeout(() => setNotice(null), 4000);
  }

  async function call(
    key: string,
    input: RequestInfo,
    init: RequestInit,
  ): Promise<Record<string, unknown> | null> {
    setBusy(key);
    setError(null);
    try {
      const response = await fetch(input, init);
      const body = (await response.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;
      if (!response.ok) {
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "Não foi possível concluir a ação.",
        );
      }
      router.refresh();
      return body;
    } catch (callError) {
      setError(
        callError instanceof Error
          ? callError.message
          : "Não foi possível concluir a ação.",
      );
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function move(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= active.length) return;
    const ids = active.map((question) => question.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    const result = await call(active[index].id, "/api/admin/questions/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (result) announce("Ordem das perguntas atualizada.");
  }

  async function remove(question: Question) {
    const result = await call(
      question.id,
      `/api/admin/questions/${question.id}`,
      { method: "DELETE" },
    );
    if (!result) return;
    setConfirming(null);
    announce(
      result.mode === "archived"
        ? `“${question.title}” saiu do formulário. As ${result.answered} respostas já recebidas continuam guardadas.`
        : `“${question.title}” foi removida.`,
    );
  }

  async function purge(question: Question) {
    const result = await call(
      question.id,
      `/api/admin/questions/${question.id}?force=1`,
      { method: "DELETE" },
    );
    if (!result) return;
    setConfirming(null);
    announce(`“${question.title}” foi excluída definitivamente.`);
  }

  async function restore(question: Question) {
    const result = await call(
      question.id,
      `/api/admin/questions/${question.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      },
    );
    if (result) announce(`“${question.title}” voltou para o formulário.`);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex flex-wrap items-end justify-between gap-5"
      >
        <div>
          <span className="eyebrow text-brand-600">Voz Jovem</span>
          <h1 className="display mt-2 text-[clamp(1.75rem,5vw,2.5rem)] text-ink-900">
            Perguntas do formulário
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            {active.length === 0
              ? "Nenhuma pergunta publicada — o formulário está fora do ar."
              : `${active.length} pergunta${active.length === 1 ? "" : "s"} no ar, na ordem abaixo.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin" className={linkButton}>
            <ChartIcon className="h-4 w-4" />
            Relatórios
          </Link>
          <Link href="/" className={linkButton}>
            Ver formulário
          </Link>
        </div>
      </motion.header>

      <AnimatePresence>
        {(notice || error) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p
              className={`mb-5 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${
                error
                  ? "border-danger-500/25 bg-danger-50 text-danger-600"
                  : "border-line bg-brand-50 text-brand-800"
              }`}
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {error ?? notice}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-5">
        <AnimatePresence mode="wait">
          {mode.kind === "new" ? (
            <QuestionForm
              key="new"
              questions={questions}
              onCancel={() => setMode({ kind: "none" })}
              onSaved={(message) => {
                setMode({ kind: "none" });
                announce(message);
                router.refresh();
              }}
            />
          ) : (
            <motion.button
              key="button"
              type="button"
              onClick={() => setMode({ kind: "new" })}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileTap={{ scale: 0.995 }}
              className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface/60 px-5 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
            >
              <PlusIcon className="h-4 w-4" />
              Adicionar pergunta
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <ul className="space-y-3">
        {active.map((question, index) => {
          const editing = mode.kind === "edit" && mode.id === question.id;
          const working = busy === question.id;

          return (
            <motion.li
              key={question.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 10) * 0.04 }}
            >
              <AnimatePresence mode="wait">
                {editing ? (
                  <QuestionForm
                    key="form"
                    question={question}
                    questions={questions}
                    onCancel={() => setMode({ kind: "none" })}
                    onSaved={(message) => {
                      setMode({ kind: "none" });
                      announce(message);
                      router.refresh();
                    }}
                  />
                ) : (
                  <motion.div
                    key="card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card flex flex-wrap items-start gap-4 rounded-xl p-4 sm:p-5"
                  >
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0 || working}
                        title="Mover para cima"
                        className="grid h-7 w-7 cursor-pointer place-items-center rounded text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        <ChevronUpIcon className="h-4 w-4" />
                      </button>
                      <span className="tnum grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === active.length - 1 || working}
                        title="Mover para baixo"
                        className="grid h-7 w-7 cursor-pointer place-items-center rounded text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-25"
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="min-w-[12rem] flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[0.68rem] font-semibold text-brand-700">
                          {QUESTION_TYPE_LABELS[question.type]}
                        </span>
                        {!question.required && (
                          <span className="rounded-md border border-line px-2 py-0.5 text-[0.68rem] font-medium text-ink-500">
                            opcional
                          </span>
                        )}
                      </div>
                      <p className="leading-snug font-semibold text-ink-900">
                        {question.title}
                      </p>
                      {question.hint && (
                        <p className="mt-1 text-xs text-ink-500">
                          {question.hint}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-ink-400">
                        {describe(question, questions)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMode({ kind: "edit", id: question.id })}
                        className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3.5 text-xs font-semibold text-ink-700 transition-colors hover:border-line-strong hover:text-brand-700"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(question.id)}
                        disabled={working}
                        className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500 disabled:opacity-40"
                        title="Remover pergunta"
                      >
                        {working ? (
                          <SpinnerIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <AnimatePresence>
                      {confirming === question.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="w-full overflow-hidden"
                        >
                          <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3">
                            <span className="text-xs font-medium text-ink-700">
                              Remover esta pergunta do formulário? As respostas
                              já recebidas continuam guardadas.
                            </span>
                            <button
                              type="button"
                              onClick={() => remove(question)}
                              disabled={working}
                              className="min-h-9 cursor-pointer rounded-lg bg-danger-500 px-4 text-xs font-semibold text-white transition-colors hover:bg-danger-600 disabled:opacity-60"
                            >
                              Sim, remover
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirming(null)}
                              className="min-h-9 cursor-pointer rounded-lg px-3 text-xs font-semibold text-ink-500 hover:text-ink-900"
                            >
                              Cancelar
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>

      {archived.length > 0 && (
        <section className="mt-12 border-t border-line pt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <ArchiveIcon className="h-4 w-4 text-ink-400" />
            Perguntas arquivadas ({archived.length})
          </h2>
          <p className="mt-1 mb-4 text-xs text-ink-500">
            Saíram do formulário e dos relatórios, mas as respostas antigas
            seguem guardadas e continuam saindo na exportação em CSV.
          </p>

          <ul className="space-y-2.5">
            {archived.map((question) => (
              <li
                key={question.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/60 p-4"
              >
                <div className="min-w-[12rem] flex-1">
                  <p className="text-sm font-medium text-ink-700">
                    {question.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {QUESTION_TYPE_LABELS[question.type]} ·{" "}
                    {describe(question, questions)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => restore(question)}
                  disabled={busy === question.id}
                  className="min-h-9 cursor-pointer rounded-lg border border-line bg-surface px-4 text-xs font-semibold text-ink-700 transition-colors hover:border-line-strong hover:text-brand-700 disabled:opacity-50"
                >
                  Restaurar
                </button>

                {confirming === `purge-${question.id}` ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => purge(question)}
                      disabled={busy === question.id}
                      className="min-h-9 cursor-pointer rounded-lg bg-danger-500 px-4 text-xs font-semibold text-white transition-colors hover:bg-danger-600 disabled:opacity-60"
                    >
                      Apagar com as respostas
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="min-h-9 cursor-pointer rounded-lg px-3 text-xs font-semibold text-ink-500 hover:text-ink-900"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(`purge-${question.id}`)}
                    className="min-h-9 cursor-pointer rounded-lg px-3 text-xs font-semibold text-ink-400 transition-colors hover:text-danger-500"
                  >
                    Excluir definitivamente
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
