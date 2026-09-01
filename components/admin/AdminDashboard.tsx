"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChartIcon,
  DownloadIcon,
  FlameIcon,
  ListIcon,
  SearchIcon,
  UsersIcon,
} from "@/components/icons";
import {
  ALL_COURSES,
  findCourseQuestion,
  filterResponsesByCourse,
  listCourseOptions,
  responseCourseLabel,
} from "@/lib/course-filter";
import { formatAnswer } from "@/lib/question-utils";
import { buildStats, type QuestionStats, type Slice, type Stats } from "@/lib/stats";
import {
  QUESTION_TYPE_LABELS,
  responseInitial,
  responseTitle,
  type FormStatus,
  type Question,
  type StoredResponse,
} from "@/lib/types";
import { Donut, HorizontalBars, Timeline, VerticalBars } from "./Charts";
import { CourseFilter } from "./CourseFilter";
import { FormStatusControl } from "./FormStatusControl";
import { ChartCard, StatCard } from "./StatCard";

const COURSE_FILTER_KEY = "voz-jovem-admin-curso";

type Tab = "relatorio" | "respostas";

const linkButton =
  "inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-xs font-semibold text-ink-700 transition-colors hover:border-line-strong hover:text-brand-700";

function scaleNames(slices: Slice[]): Slice[] {
  return slices.map((item) => ({ ...item, name: `Nota ${item.name}` }));
}

function subtitleFor(item: QuestionStats, index: number): string {
  const base = `Pergunta ${index + 1} · ${QUESTION_TYPE_LABELS[item.question.type]}`;
  const answered = `${item.answered} resposta${item.answered === 1 ? "" : "s"}`;
  if (item.question.type === "multiple") {
    return `${base} · ${answered} · cada pessoa podia marcar mais de uma opção, então a soma passa de 100%.`;
  }
  return `${base} · ${answered}`;
}

/** Gráfico adequado ao tipo da pergunta. */
function QuestionChart({ item }: { item: QuestionStats }) {
  const { question, slices } = item;

  if (question.type === "scale") {
    return <VerticalBars data={scaleNames(slices)} />;
  }

  if (question.type === "multiple" || question.type === "derived") {
    return (
      <HorizontalBars
        data={slices}
        height={Math.max(240, slices.length * 34)}
        color={question.type === "derived" ? "#1d4166" : "#3c6c9c"}
      />
    );
  }

  const wide = question.options.length + (question.allowOther ? 1 : 0) > 5;
  return wide ? <VerticalBars data={slices} /> : <Donut data={slices} />;
}

function TextAnswers({ item }: { item: QuestionStats }) {
  if (item.texts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-400">
        Nenhuma resposta escrita ainda
      </p>
    );
  }

  return (
    <ul className="custom-scroll max-h-[30rem] space-y-3 overflow-y-auto pr-2">
      {item.texts.map((answer, index) => (
        <motion.li
          key={answer.responseId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index, 10) * 0.04 }}
          className="border-l-2 border-line pl-4"
        >
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink-700">
            {answer.text}
          </p>
          <p className="mt-1.5 text-xs text-ink-400">
            {answer.name.trim() || "Resposta anônima"}
          </p>
        </motion.li>
      ))}
    </ul>
  );
}

export function AdminDashboard({
  responses,
  stats,
  formStatus,
}: {
  responses: StoredResponse[];
  stats: Stats;
  formStatus: FormStatus;
}) {
  const [tab, setTab] = useState<Tab>("relatorio");
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState(ALL_COURSES);

  const questions = useMemo(
    () => stats.questions.map((item) => item.question),
    [stats.questions],
  );

  const courseQuestion = useMemo(
    () => findCourseQuestion(questions),
    [questions],
  );

  const courseOptions = useMemo(
    () =>
      courseQuestion ? listCourseOptions(responses, courseQuestion) : [],
    [responses, courseQuestion],
  );

  useEffect(() => {
    const stored = sessionStorage.getItem(COURSE_FILTER_KEY);
    if (!stored || !courseQuestion) return;
    const exists = listCourseOptions(responses, courseQuestion).some(
      (option) => option.value === stored,
    );
    if (exists) setCourse(stored);
  }, [courseQuestion, responses]);

  function changeCourse(next: string) {
    setCourse(next);
    if (next) sessionStorage.setItem(COURSE_FILTER_KEY, next);
    else sessionStorage.removeItem(COURSE_FILTER_KEY);
  }

  const scopedResponses = useMemo(
    () => filterResponsesByCourse(responses, courseQuestion, course),
    [responses, courseQuestion, course],
  );

  const scopedStats = useMemo(
    () => (course ? buildStats(questions, scopedResponses) : stats),
    [course, questions, scopedResponses, stats],
  );

  const chartQuestions = useMemo(() => {
    if (!course || !courseQuestion) return scopedStats.questions;
    return scopedStats.questions.filter(
      (item) => item.question.id !== courseQuestion.id,
    );
  }, [course, courseQuestion, scopedStats.questions]);

  const exportHref = course
    ? `/api/admin/export?curso=${encodeURIComponent(course)}`
    : "/api/admin/export";

  /** Pergunta usada como resumo na lista e no destaque do topo. */
  const headline: Question | undefined = useMemo(
    () =>
      questions.find((question) => question.type === "derived") ??
      questions.find(
        (question) => question.type === "single" || question.type === "multiple",
      ),
    [questions],
  );

  const headlineStats = scopedStats.questions.find(
    (item) => item.question.id === headline?.id,
  );
  const topSlice = headlineStats?.slices[0];

  const scaleQuestions = scopedStats.questions
    .filter((item) => item.question.type === "scale" && item.average !== null)
    .slice(0, 2);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return scopedResponses;
    return scopedResponses.filter((response) => {
      const answers = questions
        .map((question) => formatAnswer(question, response.answers[question.id]))
        .join(" ");
      return `${response.name} ${response.email} ${answers}`
        .toLowerCase()
        .includes(term);
    });
  }, [query, questions, scopedResponses]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-5"
      >
        <div>
          <span className="eyebrow text-brand-600">Voz Jovem</span>
          <h1 className="display mt-2 text-[clamp(1.75rem,5vw,2.5rem)] text-ink-900">
            Relatório da pesquisa
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            {scopedStats.total === 0
              ? responses.length === 0
                ? "Nenhuma resposta recebida ainda."
                : "Nenhuma resposta neste curso."
              : course
                ? `${scopedStats.total} de ${responses.length} resposta${
                    responses.length === 1 ? "" : "s"
                  } — ${course}.`
                : `${scopedStats.total} resposta${
                    scopedStats.total === 1 ? "" : "s"
                  } recebida${scopedStats.total === 1 ? "" : "s"}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/perguntas" className={linkButton}>
            <ListIcon className="h-4 w-4" />
            Perguntas
          </Link>
          <Link href="/" className={linkButton}>
            Ver formulário
          </Link>
          <a
            href={exportHref}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-800"
          >
            <DownloadIcon className="h-4 w-4" />
            Exportar CSV
            {course ? " do curso" : ""}
          </a>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="min-h-10 cursor-pointer rounded-lg px-3 text-xs font-semibold text-ink-500 transition-colors hover:text-danger-500"
            >
              Sair
            </button>
          </form>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mt-6"
      >
        <FormStatusControl status={formStatus} />
      </motion.div>

      {courseQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4 }}
          className="mt-4"
        >
          <CourseFilter
            options={courseOptions}
            total={responses.length}
            value={course}
            onChange={changeCourse}
          />
        </motion.div>
      )}

      <div className="mt-8 mb-6 flex gap-6 border-b border-line">
        {(
          [
            ["relatorio", "Resumo e gráficos"],
            ["respostas", `Respostas (${scopedResponses.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`relative -mb-px cursor-pointer py-3 text-sm font-semibold transition-colors ${
              tab === value
                ? "text-brand-800"
                : "text-ink-500 hover:text-ink-700"
            }`}
          >
            {label}
            {tab === value && (
              <motion.span
                layoutId="admin-tab"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
                className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-700"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "relatorio" ? (
          <motion.div
            key="relatorio"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Respostas"
                value={scopedStats.total}
                delay={0}
                icon={<UsersIcon className="h-5 w-5" />}
                hint={course ? "Neste curso" : "Total de participantes"}
              />
              <StatCard
                label="Perguntas no ar"
                value={questions.length}
                delay={0.06}
                icon={<ListIcon className="h-5 w-5" />}
                hint="Publicadas no formulário"
              />
              {scaleQuestions.map((item, index) => (
                <StatCard
                  key={item.question.id}
                  label={item.question.title.slice(0, 34)}
                  value={item.average ?? 0}
                  decimals={1}
                  suffix={` / ${item.question.scaleMax}`}
                  delay={0.12 + index * 0.06}
                  icon={<FlameIcon className="h-5 w-5" />}
                  hint="Média das notas"
                />
              ))}
              {scaleQuestions.length === 0 && (
                <StatCard
                  label="Respostas hoje"
                  value={
                    scopedStats.perDay[scopedStats.perDay.length - 1]?.value ?? 0
                  }
                  delay={0.12}
                  icon={<ChartIcon className="h-5 w-5" />}
                  hint="Último dia com registro"
                />
              )}
            </div>

            {headline && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.45 }}
                className="card rounded-xl border-l-2 border-l-brand-700 p-6"
              >
                <p className="eyebrow text-ink-500">Resposta mais votada</p>
                <p className="display mt-2 text-[clamp(1.375rem,4vw,1.875rem)] text-ink-900">
                  {scopedStats.total === 0 || !topSlice
                    ? "Aguardando respostas"
                    : topSlice.name}
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  {headline.title}
                  {topSlice
                    ? ` — ${topSlice.value} de ${headlineStats?.answered} (${Math.round(topSlice.percent)}%)`
                    : ""}
                </p>
              </motion.div>
            )}

            {scopedStats.total === 0 && responses.length > 0 ? (
              <div className="card rounded-xl px-6 py-14 text-center">
                <p className="font-semibold text-ink-700">
                  Nenhuma resposta neste curso
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  Escolha outro curso ou limpe o filtro para ver o relatório
                  completo.
                </p>
              </div>
            ) : chartQuestions.length === 0 ? (
              <div className="card rounded-xl px-6 py-14 text-center">
                <p className="font-semibold text-ink-700">
                  Nenhuma pergunta publicada
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  Cadastre perguntas em{" "}
                  <Link
                    href="/admin/perguntas"
                    className="font-semibold text-brand-600 underline underline-offset-2"
                  >
                    Gerenciar perguntas
                  </Link>{" "}
                  para começar a receber respostas.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-5 lg:grid-cols-2">
                  {chartQuestions.map((item, index) => {
                    const wide =
                      item.question.type === "multiple" ||
                      item.question.type === "derived" ||
                      item.question.type === "text";

                    return (
                      <ChartCard
                        key={item.question.id}
                        title={item.question.title}
                        subtitle={subtitleFor(item, index)}
                        delay={Math.min(index, 6) * 0.04}
                        className={wide ? "lg:col-span-2" : ""}
                      >
                        {item.question.type === "text" ? (
                          <TextAnswers item={item} />
                        ) : (
                          <QuestionChart item={item} />
                        )}
                      </ChartCard>
                    );
                  })}
                </div>

                <ChartCard
                  title="Respostas por dia"
                  subtitle="Volume de participação ao longo do tempo"
                >
                  <Timeline data={scopedStats.perDay} />
                </ChartCard>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="respostas"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative mb-5">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por resposta..."
                className="field-base focus:field-base-focus min-h-12 py-3 pr-4 pl-11 text-sm placeholder:text-ink-300"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="card rounded-xl px-6 py-14 text-center text-sm text-ink-400">
                {responses.length === 0
                  ? "Nenhuma resposta recebida ainda."
                  : query.trim()
                    ? "Nenhuma resposta encontrada para essa busca."
                    : "Nenhuma resposta neste curso."}
              </p>
            ) : (
              <ul className="space-y-3">
                {filtered.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index, 12) * 0.03 }}
                  >
                    <Link
                      href={`/admin/respostas/${item.id}`}
                      className="card group block rounded-xl p-4 transition-colors hover:border-brand-300"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
                          {responseInitial(item)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-ink-900">
                            {responseTitle(item)}
                          </p>
                          <p className="truncate text-xs text-ink-500">
                            {courseQuestion
                              ? responseCourseLabel(item, courseQuestion)
                              : item.email.trim() ||
                                new Date(item.createdAt).toLocaleString(
                                  "pt-BR",
                                  {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  },
                                )}
                          </p>
                        </div>

                        <span className="tnum shrink-0 text-xs text-ink-400">
                          {new Date(item.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })}
                        </span>
                      </div>

                      {headline && (
                        <div className="mt-3 border-t border-line pt-3">
                          <p className="eyebrow text-ink-400">
                            {headline.title.slice(0, 40)}
                          </p>
                          <p className="mt-1 text-sm text-ink-700">
                            {formatAnswer(headline, item.answers[headline.id]) ||
                              "—"}
                          </p>
                        </div>
                      )}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
