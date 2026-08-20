"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckIcon } from "@/components/icons";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Props = {
  label: string;
  index: number;
  selected: boolean;
  disabled?: boolean;
  multiple?: boolean;
  onSelect: () => void;
};

export function OptionButton({
  label,
  index,
  selected,
  disabled = false,
  multiple = false,
  onSelect,
}: Props) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      initial={{ opacity: 0, y: reduced ? 0 : 10 }}
      animate={{ opacity: disabled ? 0.45 : 1, y: 0 }}
      transition={{
        delay: Math.min(index, 12) * 0.03,
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      aria-pressed={selected}
      className={`option-base cursor-pointer disabled:cursor-not-allowed ${
        selected
          ? "border-brand-600 shadow-[inset_0_0_0_1px_var(--color-brand-600)]"
          : "hover:border-line-strong hover:bg-brand-50/40"
      }`}
    >
      <AnimatePresence initial={false}>
        {selected && (
          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 origin-left bg-brand-50"
          />
        )}
      </AnimatePresence>

      <span
        className={`relative grid h-8 w-8 shrink-0 place-items-center border text-[0.78rem] font-semibold transition-colors ${
          multiple ? "rounded-md" : "rounded-full"
        } ${
          selected
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-line text-ink-500"
        }`}
      >
        {selected ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          (LETTERS[index] ?? index + 1)
        )}
      </span>

      <span
        className={`relative flex-1 leading-snug ${
          selected ? "font-semibold text-ink-900" : ""
        }`}
      >
        {label}
      </span>
    </motion.button>
  );
}
