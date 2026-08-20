"use client";

import { motion } from "motion/react";
import { useId } from "react";

type BaseProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
};

const shell =
  "w-full rounded-2xl border-2 bg-white/85 px-4 py-3.5 text-base text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:bg-white";

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  error,
  autoFocus,
  type = "text",
}: BaseProps & { type?: "text" | "email" }) {
  const id = useId();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-bold text-ink-700"
      >
        {label}
      </label>
      {hint && <p className="mb-2 text-xs text-ink-500">{hint}</p>}
      <input
        id={id}
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${shell} ${
          error
            ? "border-accent-500 focus:border-accent-500"
            : "border-brand-100 focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(115,80,240,0.14)]"
        }`}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-1.5 text-xs font-semibold text-accent-500"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}

export function TextAreaField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  maxLength = 1200,
}: Omit<BaseProps, "label"> & { label?: string; maxLength?: number }) {
  const id = useId();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-bold text-ink-700"
        >
          {label}
        </label>
      )}
      {hint && <p className="mb-2 text-xs text-ink-500">{hint}</p>}
      <textarea
        id={id}
        value={value}
        rows={6}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${shell} custom-scroll resize-none border-brand-100 leading-relaxed focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(115,80,240,0.14)]`}
      />
      <div className="mt-1.5 text-right text-xs font-semibold text-ink-300">
        {value.length} / {maxLength}
      </div>
    </motion.div>
  );
}

export function InlineOtherField({
  value,
  onChange,
  placeholder = "Escreva aqui...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <motion.input
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: "auto", marginTop: 10 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      value={value}
      autoFocus
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border-2 border-dashed border-brand-300 bg-white/90 px-4 py-3 text-base text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500"
    />
  );
}
