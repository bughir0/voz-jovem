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

const reveal = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

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
    <motion.div {...reveal}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-ink-700"
      >
        {label}
      </label>
      {hint && <p className="mb-2 text-xs text-ink-500">{hint}</p>}
      <input
        id={id}
        type={type}
        value={value}
        autoFocus={autoFocus}
        autoComplete={type === "email" ? "email" : "name"}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`field-base focus:field-base-focus min-h-13 px-4 py-3.5 placeholder:text-ink-300 ${
          error ? "border-danger-500" : ""
        }`}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-1.5 text-xs font-medium text-danger-500"
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
    <motion.div {...reveal}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-semibold text-ink-700"
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
        className="field-base focus:field-base-focus custom-scroll resize-none px-4 py-3.5 leading-relaxed placeholder:text-ink-300"
      />
      <div className="tnum mt-1.5 text-right text-xs text-ink-400">
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
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: "auto", marginTop: 8 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden pl-4"
    >
      <input
        value={value}
        autoFocus
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field-base focus:field-base-focus min-h-12 border-dashed px-4 py-3 placeholder:text-ink-300"
      />
    </motion.div>
  );
}
