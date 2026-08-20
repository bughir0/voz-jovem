"use client";

import { motion } from "motion/react";
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
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: disabled ? 0.45 : 1, y: 0 }}
      transition={{
        delay: Math.min(index, 12) * 0.028,
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={disabled ? undefined : { scale: 1.015, x: 3 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      aria-pressed={selected}
      className={`option-base cursor-pointer disabled:cursor-not-allowed ${
        selected
          ? "border-brand-500 bg-brand-50 text-ink-900 shadow-[0_14px_34px_-16px_rgba(115,80,240,0.75)]"
          : "hover:border-brand-300 hover:bg-white"
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center text-[0.78rem] font-bold transition-colors ${
          multiple ? "rounded-[0.6rem]" : "rounded-full"
        } ${
          selected
            ? "bg-gradient-to-br from-brand-500 to-accent-500 text-white"
            : "bg-brand-50 text-brand-500"
        }`}
      >
        {selected ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          (LETTERS[index] ?? index + 1)
        )}
      </span>

      <span className="flex-1 leading-snug">{label}</span>

      {selected && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-brand-500 to-accent-500"
        />
      )}
    </motion.button>
  );
}
