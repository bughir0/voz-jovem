"use client";

import { motion } from "motion/react";

export function QuestionsChangedModal({
  onRestart,
}: {
  onRestart: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="questions-changed-title"
      className="fixed inset-0 z-50 grid place-items-center bg-ink-900/55 px-5"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl"
      >
        <p className="eyebrow text-brand-600">Pesquisa atualizada</p>
        <h2
          id="questions-changed-title"
          className="display mt-2 text-2xl text-ink-900"
        >
          O formulário mudou
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          Uma pergunta foi adicionada ou removida. Para as respostas baterem
          com o questionário novo, o preenchimento vai recomeçar do início.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-6 inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          Recomeçar agora
        </button>
        <p className="mt-3 text-center text-xs text-ink-400">
          Recomeça sozinho em alguns segundos.
        </p>
      </motion.div>
    </div>
  );
}
