"use client";

import { motion } from "motion/react";
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

  return (
    <div>
      <div className="flex items-stretch gap-2 sm:gap-3">
        {values.map((item, index) => {
          const active = value === item;
          const endLabel =
            index === 0
              ? question.scaleMinLabel
              : index === values.length - 1
                ? question.scaleMaxLabel
                : null;

          return (
            <motion.button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              initial={{ opacity: 0, y: 18, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: Math.min(index, 10) * 0.06,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              whileHover={{ y: -6, scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              aria-pressed={active}
              className={`flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-1 py-4 transition-colors ${
                active
                  ? "border-brand-500 bg-brand-50 shadow-[0_18px_40px_-18px_rgba(115,80,240,0.8)]"
                  : "border-brand-100 bg-white/80 hover:border-brand-300"
              }`}
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-full text-lg font-extrabold transition-colors ${
                  active
                    ? "bg-gradient-to-br from-brand-500 to-accent-500 text-white"
                    : "bg-brand-50 text-brand-600"
                }`}
              >
                {item}
              </span>
              {endLabel && (
                <span
                  className={`text-center text-[0.68rem] leading-tight font-semibold sm:text-xs ${
                    active ? "text-brand-700" : "text-ink-500"
                  }`}
                >
                  {endLabel}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {(question.scaleMinLabel || question.scaleMaxLabel) && (
        <div className="mt-4 flex justify-between text-xs font-semibold text-ink-300">
          <span>
            {question.scaleMin}
            {question.scaleMinLabel ? ` — ${question.scaleMinLabel}` : ""}
          </span>
          <span>
            {question.scaleMax}
            {question.scaleMaxLabel ? ` — ${question.scaleMaxLabel}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
