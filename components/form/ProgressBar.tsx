"use client";

import { motion } from "motion/react";

type Props = {
  /** Etapa atual, começando em 1. */
  current: number;
  total: number;
  label: string;
  /** Recebe o índice (base 0) da etapa escolhida; só etapas já vistas chamam. */
  onSelect?: (index: number) => void;
};

export function ProgressBar({ current, total, label, onSelect }: Props) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow text-ink-500">{label}</span>
        <span className="tnum text-xs font-semibold text-brand-600">
          {percent}%
        </span>
      </div>

      <div className="mt-2 flex gap-1">
        {Array.from({ length: total }, (_, index) => {
          const reached = index < current;
          const visited = index < current - 1;

          return (
            <button
              key={index}
              type="button"
              disabled={!visited}
              onClick={() => onSelect?.(index)}
              aria-label={`Ir para a pergunta ${index + 1}`}
              className="group h-4 flex-1 disabled:cursor-default"
            >
              <span className="block h-1 w-full overflow-hidden rounded-full bg-line transition-colors group-enabled:group-hover:bg-brand-200">
                <motion.span
                  className="block h-full w-full origin-left rounded-full bg-brand-600"
                  initial={false}
                  animate={{ scaleX: reached ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
