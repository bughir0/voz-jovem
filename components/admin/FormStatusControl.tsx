"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertIcon, SpinnerIcon } from "@/components/icons";
import { FORM_STATUS_CHANNEL } from "@/lib/form-status-sync";
import {
  FORM_STATUSES,
  FORM_STATUS_HINTS,
  FORM_STATUS_LABELS,
  type FormStatus,
} from "@/lib/types";

const TONE: Record<FormStatus, { card: string; dot: string; text: string }> = {
  open: {
    card: "border-line",
    dot: "bg-success-500",
    text: "text-ink-500",
  },
  paused: {
    card: "border-amber-500/40 bg-amber-500/8",
    dot: "bg-amber-500",
    text: "text-amber-500",
  },
  closed: {
    card: "border-danger-500/40 bg-danger-50",
    dot: "bg-danger-500",
    text: "text-danger-600",
  },
};

export function FormStatusControl({ status }: { status: FormStatus }) {
  const router = useRouter();
  const [current, setCurrent] = useState<FormStatus>(status);
  const [saving, setSaving] = useState<FormStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setCurrent(status), [status]);

  async function change(next: FormStatus) {
    if (next === current || saving) return;
    const previous = current;

    setCurrent(next);
    setSaving(next);
    setError(null);

    try {
      const response = await fetch("/api/admin/form-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error();
      const channel = new BroadcastChannel(FORM_STATUS_CHANNEL);
      channel.postMessage(next);
      channel.close();
      router.refresh();
    } catch {
      setCurrent(previous);
      setError("Não foi possível mudar a situação. Tente novamente.");
    } finally {
      setSaving(null);
    }
  }

  const tone = TONE[current];

  return (
    <section
      className={`card rounded-xl border p-4 transition-colors sm:p-5 ${tone.card}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-55 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            {current === "open" ? (
              <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
            ) : (
              <AlertIcon className={`h-4 w-4 ${tone.text}`} />
            )}
            Formulário {FORM_STATUS_LABELS[current].toLowerCase()}
          </p>
          <p className={`mt-1 text-xs leading-relaxed ${tone.text}`}>
            {FORM_STATUS_HINTS[current]}
          </p>
        </div>

        <div className="flex rounded-lg border border-line bg-surface p-1">
          {FORM_STATUSES.map((value) => {
            const active = value === current;
            return (
              <button
                key={value}
                type="button"
                onClick={() => change(value)}
                disabled={saving !== null}
                aria-pressed={active}
                className={`relative min-h-9 cursor-pointer rounded-md px-4 text-xs font-semibold transition-colors disabled:cursor-wait ${
                  active ? "text-white" : "text-ink-500 hover:text-ink-800"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="form-status-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-md bg-brand-700"
                  />
                )}
                <span className="relative inline-flex items-center gap-1.5">
                  {saving === value && (
                    <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {FORM_STATUS_LABELS[value]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-danger-600">{error}</p>}
    </section>
  );
}
