"use client";

import { motion } from "motion/react";
import { useState } from "react";
import {
  AlertIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon,
} from "@/components/icons";
import { MAX_OPTIONS, MAX_SCALE_POINTS } from "@/lib/parse-question";
import {
  QUESTION_TYPES,
  QUESTION_TYPE_HINTS,
  QUESTION_TYPE_LABELS,
  type Question,
  type QuestionType,
} from "@/lib/types";

type Draft = {
  type: QuestionType;
  title: string;
  hint: string;
  required: boolean;
  options: string[];
  allowOther: boolean;
  maxChoices: number;
  scaleMin: number;
  scaleMax: number;
  scaleMinLabel: string;
  scaleMaxLabel: string;
  sourceQuestionId: string;
};

function toDraft(question?: Question): Draft {
  if (!question) {
    return {
      type: "single",
      title: "",
      hint: "",
      required: true,
      options: ["", ""],
      allowOther: false,
      maxChoices: 1,
      scaleMin: 1,
      scaleMax: 5,
      scaleMinLabel: "",
      scaleMaxLabel: "",
      sourceQuestionId: "",
    };
  }

  return {
    type: question.type,
    title: question.title,
    hint: question.hint ?? "",
    required: question.required,
    options:
      question.options.length > 0 ? [...question.options] : ["", ""],
    allowOther: question.allowOther,
    maxChoices: question.maxChoices ?? 1,
    scaleMin: question.scaleMin,
    scaleMax: question.scaleMax,
    scaleMinLabel: question.scaleMinLabel ?? "",
    scaleMaxLabel: question.scaleMaxLabel ?? "",
    sourceQuestionId: question.sourceQuestionId ?? "",
  };
}

const inputClass =
  "field-base focus:field-base-focus min-h-11 px-3.5 py-2.5 text-sm placeholder:text-ink-300";

const labelClass = "mb-1.5 block text-xs font-semibold text-ink-700";

export function QuestionForm({
  question,
  questions,
  onCancel,
  onSaved,
}: {
  question?: Question;
  questions: Question[];
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(question));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sources = questions.filter(
    (item) =>
      item.type === "multiple" && !item.archived && item.id !== question?.id,
  );

  function patch(changes: Partial<Draft>) {
    setDraft((previous) => ({ ...previous, ...changes }));
    setError(null);
  }

  function changeType(type: QuestionType) {
    const options =
      draft.options.filter((item) => item.trim()).length >= 2
        ? draft.options
        : ["", ""];
    patch({
      type,
      options,
      maxChoices:
        type === "multiple"
          ? Math.min(3, Math.max(1, options.length))
          : draft.maxChoices,
      sourceQuestionId:
        type === "derived"
          ? draft.sourceQuestionId || sources[0]?.id || ""
          : "",
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        question
          ? `/api/admin/questions/${question.id}`
          : "/api/admin/questions",
        {
          method: question ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: draft.type,
            title: draft.title,
            hint: draft.hint,
            required: draft.required,
            options: draft.options,
            allowOther: draft.allowOther,
            maxChoices: draft.maxChoices,
            scaleMin: draft.scaleMin,
            scaleMax: draft.scaleMax,
            scaleMinLabel: draft.scaleMinLabel,
            scaleMaxLabel: draft.scaleMaxLabel,
            sourceQuestionId: draft.sourceQuestionId,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Não foi possível salvar a pergunta.");
      }

      onSaved(
        question ? "Pergunta atualizada." : "Pergunta adicionada ao formulário.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar a pergunta.",
      );
      setSaving(false);
    }
  }

  const hasOptions = draft.type === "single" || draft.type === "multiple";
  const choiceCount = draft.options.filter((item) => item.trim()).length +
    (draft.allowOther ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -12, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="card rounded-xl border-brand-300 p-5 sm:p-6">
        <h2 className="display text-lg text-ink-900">
          {question ? "Editar pergunta" : "Nova pergunta"}
        </h2>

        <div className="mt-5 space-y-5">
          <div>
            <span className={labelClass}>Tipo de resposta</span>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map((type) => {
                const active = draft.type === type;
                const disabled = type === "derived" && sources.length === 0;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={disabled}
                    onClick={() => changeType(type)}
                    title={
                      disabled
                        ? "Crie antes uma pergunta de múltipla escolha"
                        : QUESTION_TYPE_HINTS[type]
                    }
                    className={`min-h-9 cursor-pointer rounded-lg border px-4 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      active
                        ? "border-brand-600 bg-brand-50 text-brand-800"
                        : "border-line bg-surface text-ink-500 hover:border-line-strong"
                    }`}
                  >
                    {QUESTION_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-ink-500">
              {QUESTION_TYPE_HINTS[draft.type]}
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="question-title">
              Enunciado
            </label>
            <input
              id="question-title"
              value={draft.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="Ex.: Como você avalia o transporte no seu bairro?"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="question-hint">
              Texto de apoio <span className="text-ink-300">(opcional)</span>
            </label>
            <input
              id="question-hint"
              value={draft.hint}
              onChange={(event) => patch({ hint: event.target.value })}
              placeholder="Ex.: Pense nos últimos 12 meses."
              className={inputClass}
            />
          </div>

          {draft.type === "derived" && (
            <div>
              <label className={labelClass} htmlFor="question-source">
                Pergunta de origem
              </label>
              <select
                id="question-source"
                value={draft.sourceQuestionId}
                onChange={(event) =>
                  patch({ sourceQuestionId: event.target.value })
                }
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {sources.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-ink-500">
                As alternativas serão exatamente as que a pessoa marcar nessa
                pergunta.
              </p>
            </div>
          )}

          {hasOptions && (
            <div>
              <span className={labelClass}>
                Alternativas ({draft.options.length} de {MAX_OPTIONS})
              </span>
              <div className="space-y-2">
                {draft.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="tnum grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                      {index + 1}
                    </span>
                    <input
                      value={option}
                      onChange={(event) => {
                        const options = [...draft.options];
                        options[index] = event.target.value;
                        patch({ options });
                      }}
                      placeholder={`Alternativa ${index + 1}`}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          options: draft.options.filter(
                            (_, position) => position !== index,
                          ),
                        })
                      }
                      disabled={draft.options.length <= 2}
                      title="Remover alternativa"
                      className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => patch({ options: [...draft.options, ""] })}
                disabled={draft.options.length >= MAX_OPTIONS}
                className="mt-3 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-4 text-xs font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Adicionar alternativa
              </button>

              <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={draft.allowOther}
                  onChange={(event) =>
                    patch({ allowOther: event.target.checked })
                  }
                  className="h-4 w-4 accent-brand-700"
                />
                Incluir alternativa “Outro” com campo de texto
              </label>
            </div>
          )}

          {draft.type === "multiple" && (
            <div>
              <label className={labelClass} htmlFor="question-max">
                Máximo de alternativas marcadas
              </label>
              <input
                id="question-max"
                type="number"
                min={1}
                max={Math.max(choiceCount, 1)}
                value={draft.maxChoices}
                onChange={(event) =>
                  patch({ maxChoices: Number(event.target.value) })
                }
                className={`${inputClass} max-w-[8rem]`}
              />
              <p className="mt-1.5 text-xs text-ink-500">
                Hoje existem {choiceCount} alternativas disponíveis.
              </p>
            </div>
          )}

          {draft.type === "scale" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="scale-min">
                  Menor valor
                </label>
                <input
                  id="scale-min"
                  type="number"
                  value={draft.scaleMin}
                  onChange={(event) =>
                    patch({ scaleMin: Number(event.target.value) })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="scale-max">
                  Maior valor
                </label>
                <input
                  id="scale-max"
                  type="number"
                  value={draft.scaleMax}
                  onChange={(event) =>
                    patch({ scaleMax: Number(event.target.value) })
                  }
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-ink-500">
                  Até {MAX_SCALE_POINTS} valores na escala.
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="scale-min-label">
                  Rótulo do menor valor{" "}
                  <span className="text-ink-300">(opcional)</span>
                </label>
                <input
                  id="scale-min-label"
                  value={draft.scaleMinLabel}
                  onChange={(event) =>
                    patch({ scaleMinLabel: event.target.value })
                  }
                  placeholder="Ex.: Muito pouco"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="scale-max-label">
                  Rótulo do maior valor{" "}
                  <span className="text-ink-300">(opcional)</span>
                </label>
                <input
                  id="scale-max-label"
                  value={draft.scaleMaxLabel}
                  onChange={(event) =>
                    patch({ scaleMaxLabel: event.target.value })
                  }
                  placeholder="Ex.: Muito"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={draft.required}
              onChange={(event) => patch({ required: event.target.checked })}
              className="h-4 w-4 accent-brand-700"
            />
            Resposta obrigatória
          </label>

          {error && (
            <p className="flex items-start gap-2 rounded-lg border border-danger-500/25 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-brand-700 px-6 text-xs font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70"
            >
              {saving && <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />}
              {question ? "Salvar alterações" : "Adicionar pergunta"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="min-h-10 cursor-pointer rounded-lg px-4 text-xs font-semibold text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
