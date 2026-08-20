"use client";

import { motion } from "motion/react";

type Props = {
  number: number;
  total: number;
  title: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function QuestionShell({
  number,
  total,
  title,
  hint,
  required = true,
  children,
}: Props) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-3 flex items-center gap-2.5"
      >
        <span className="rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-3 py-1 text-xs font-bold tracking-wide text-white">
          {number} / {total}
        </span>
        {!required && (
          <span className="rounded-full border border-brand-200 bg-white/70 px-2.5 py-1 text-xs font-semibold text-ink-500">
            opcional
          </span>
        )}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-2xl leading-tight font-extrabold tracking-tight text-ink-900 sm:text-[1.75rem]"
      >
        {title}
      </motion.h2>

      {hint && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-2 text-sm text-ink-500"
        >
          {hint}
        </motion.p>
      )}

      <div className="mt-6">{children}</div>
    </div>
  );
}
