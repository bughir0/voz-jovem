"use client";

import type { CourseOption } from "@/lib/course-filter";

export function CourseFilter({
  options,
  total,
  value,
  onChange,
}: {
  options: CourseOption[];
  total: number;
  value: string;
  onChange: (value: string) => void;
}) {
  if (options.length === 0) return null;

  const selectedCount = options.find((option) => option.value === value)?.count;

  return (
    <section className="card rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="course-filter" className="eyebrow text-ink-500">
            Filtrar por curso
          </label>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            {value
              ? `Mostrando ${selectedCount ?? 0} de ${total} resposta${
                  total === 1 ? "" : "s"
                } — ${value}.`
              : "Os gráficos e a lista passam a considerar só o curso escolhido."}
          </p>
        </div>

        <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:min-w-80">
          <select
            id="course-filter"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="field-base focus:field-base-focus min-h-11 w-full px-3.5 py-2.5 text-sm"
          >
            <option value="">
              Todos os cursos ({total})
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
              </option>
            ))}
          </select>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="min-h-11 shrink-0 cursor-pointer rounded-lg px-3 text-xs font-semibold text-ink-500 transition-colors hover:text-brand-700"
            >
              Limpar
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
