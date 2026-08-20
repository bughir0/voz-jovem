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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <span className="tnum eyebrow text-brand-600">
          {String(number).padStart(2, "0")} — {String(total).padStart(2, "0")}
        </span>
        {!required && (
          <span className="rounded-full border border-line px-2 py-0.5 text-[0.68rem] font-medium text-ink-500">
            opcional
          </span>
        )}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="display mt-3 text-[clamp(1.5rem,4.5vw,2rem)] text-ink-900"
      >
        {title}
      </motion.h2>

      {hint && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="mt-2 text-sm leading-relaxed text-ink-500"
        >
          {hint}
        </motion.p>
      )}

      <div className="mt-6">{children}</div>
    </div>
  );
}
