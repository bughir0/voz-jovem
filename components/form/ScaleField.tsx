"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { scaleValues } from "@/lib/question-utils";
import type { Question } from "@/lib/types";

export function ScaleField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: number | null;
  onChange: (value: number) => void;
}) {
  const values = scaleValues(question);
  const reduced = useReducedMotion();
  const indicatorId = useId();

  return (
    <div>
      <div className="flex items-stretch gap-1.5 sm:gap-2">
        {values.map((item, index) => {
          const active = value === item;

          return (
            <motion.button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(index, 10) * 0.04,
                duration: 0.32,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileTap={{ scale: 0.96 }}
              aria-pressed={active}
              className={`relative flex min-h-14 flex-1 cursor-pointer items-center justify-center rounded-xl border transition-colors ${
                active
                  ? "border-brand-600"
                  : "border-line bg-surface hover:border-line-strong"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={indicatorId}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-brand-600"
                />
              )}
              <span
                className={`tnum relative text-lg font-semibold ${
                  active ? "text-white" : "text-ink-700"
                }`}
              >
                {item}
              </span>
            </motion.button>
          );
        })}
      </div>

      {(question.scaleMinLabel || question.scaleMaxLabel) && (
        <div className="mt-3 flex justify-between gap-4 text-xs text-ink-500">
          <span className="max-w-[45%]">
            {question.scaleMin}
            {question.scaleMinLabel ? ` · ${question.scaleMinLabel}` : ""}
          </span>
          <span className="max-w-[45%] text-right">
            {question.scaleMax}
            {question.scaleMaxLabel ? ` · ${question.scaleMaxLabel}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
