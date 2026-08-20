"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChartIcon,
  DownloadIcon,
  FlameIcon,
  ListIcon,
  SearchIcon,
  UsersIcon,
} from "@/components/icons";
import { formatAnswer } from "@/lib/question-utils";
import type { QuestionStats, Slice, Stats } from "@/lib/stats";
import { QUESTION_TYPE_LABELS, type Question, type StoredResponse } from "@/lib/types";
import { Donut, HorizontalBars, Timeline, VerticalBars } from "./Charts";
import { ChartCard, StatCard } from "./StatCard";

type Tab = "relatorio" | "respostas";

const ACCENTS = ["#7350f0", "#f0479f", "#ffb43d", "#35d6b0"];

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
        color={question.type === "derived" ? "#5b34d6" : "#7350f0"}
      />
    );
  }

  const wide = question.options.length + (question.allowOther ? 1 : 0) > 5;
  return wide ? <VerticalBars data={slices} /> : <Donut data={slices} />;
}

function TextAnswers({ item }: { item: QuestionStats }) {
  if (item.texts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brand-200 px-4 py-8 text-center text-sm font-semibold text-ink-300">
        Nenhuma resposta escrita ainda
      </p>
    );
  }

  return (
    <ul className="custom-scroll max-h-[30rem] space-y-3 overflow-y-auto pr-2">
      {item.texts.map((answer, index) => (
        <motion.li
          key={answer.responseId}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(index, 10) * 0.04 }}
          className="rounded-2xl border border-brand-100 bg-white/70 p-4"
        >
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink-700">
            “{answer.text}”
          </p>
          <p className="mt-2 text-xs font-bold text-ink-300">{answer.name}</p>
        </motion.li>
      ))}
    </ul>
  );
}

export function AdminDashboard({
  responses,
  stats,
}: {
  responses: StoredResponse[];
  stats: Stats;
}) {
  const [tab, setTab] = useState<Tab>("relatorio");
  const [query, setQuery] = useState("");

  const questions = useMemo(
    () => stats.questions.map((item) => item.question),
    [stats.questions],
  );

  /** Pergunta usada como resumo na lista e no destaque do topo. */
  const headline: Question | undefined = useMemo(
    () =>
      questions.find((question) => question.type === "derived") ??
      questions.find(
        (question) => question.type === "single" || question.type === "multiple",
      ),
    [questions],
  );

  const headlineStats = stats.questions.find(
    (item) => item.question.id === headline?.id,
  );
  const topSlice = headlineStats?.slices[0];

  const scaleQuestions = stats.questions
    .filter((item) => item.question.type === "scale" && item.average !== null)
    .slice(0, 2);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return responses;
    return responses.filter((response) => {
      const answers = questions
        .map((question) => formatAnswer(question, response.answers[question.id]))
        .join(" ");
      return `${response.name} ${response.email} ${answers}`
        .toLowerCase()
        .includes(term);
    });
  }, [query, questions, responses]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-brand-600 uppercase">
            Voz Jovem
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
            Relatório da pesquisa
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {stats.total === 0
              ? "Nenhuma resposta recebida ainda."
              : `${stats.total} resposta${stats.total === 1 ? "" : "s"} recebida${
                  stats.total === 1 ? "" : "s"
                }.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/perguntas"
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-4 py-2.5 text-xs font-bold text-brand-600 transition-colors hover:border-brand-400 hover:bg-white"
          >
            <ListIcon className="h-4 w-4" />
            Gerenciar perguntas
          </Link>
          <Link
            href="/"
            className="rounded-full border border-brand-200 bg-white/70 px-4 py-2.5 text-xs font-bold text-brand-600 transition-colors hover:border-brand-400 hover:bg-white"
          >
            Ver formulário
          </Link>
          <a
            href="/api/admin/export"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 px-5 py-2.5 text-xs font-bold text-white shadow-glow"
          >
            <DownloadIcon className="h-4 w-4" />
            Exportar CSV
          </a>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="cursor-pointer rounded-full px-4 py-2.5 text-xs font-bold text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              Sair
            </button>
          </form>
        </div>
      </motion.header>

      <div className="mb-8 inline-flex rounded-full border border-brand-200 bg-white/70 p-1 backdrop-blur">
        {(
          [
            ["relatorio", "Resumo e gráficos"],
            ["respostas", `Respostas individuais (${responses.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`relative cursor-pointer rounded-full px-5 py-2 text-xs font-bold transition-colors sm:text-sm ${
              tab === value ? "text-white" : "text-ink-500 hover:text-brand-600"
            }`}
          >
            {tab === value && (
              <motion.span
                layoutId="admin-tab"
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-600 to-accent-500"
              />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "relatorio" ? (
          <motion.div
            key="relatorio"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Respostas"
                value={stats.total}
                accent="#7350f0"
                delay={0}
                icon={<UsersIcon className="h-5 w-5" />}
                hint="Total de participantes"
              />
              <StatCard
                label="Perguntas no ar"
                value={questions.length}
                accent="#5b34d6"
                delay={0.08}
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
                  accent={ACCENTS[(index + 1) % ACCENTS.length]}
                  delay={0.16 + index * 0.08}
                  icon={<FlameIcon className="h-5 w-5" />}
                  hint="Média das notas"
                />
              ))}
              {scaleQuestions.length === 0 && (
                <StatCard
                  label="Respostas hoje"
                  value={
                    stats.perDay[stats.perDay.length - 1]?.value ?? 0
                  }
                  accent="#35d6b0"
                  delay={0.16}
                  icon={<ChartIcon className="h-5 w-5" />}
                  hint="Último dia com registro"
                />
              )}
            </div>

            {headline && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="glass-card rounded-2xl p-6"
              >
                <p className="text-xs font-bold tracking-[0.14em] text-ink-500 uppercase">
                  Resposta mais votada
                </p>
                <p className="mt-2 text-2xl leading-tight font-black tracking-tight text-ink-900 sm:text-3xl">
                  {stats.total === 0 || !topSlice ? (
                    "Aguardando respostas"
                  ) : (
                    <span className="text-gradient">{topSlice.name}</span>
                  )}
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  {headline.title}
                  {topSlice
                    ? ` — ${topSlice.value} de ${headlineStats?.answered} (${Math.round(topSlice.percent)}%)`
                    : ""}
                </p>
              </motion.div>
            )}

            {stats.questions.length === 0 ? (
              <div className="glass-card rounded-2xl px-6 py-14 text-center">
                <p className="text-sm font-bold text-ink-700">
                  Nenhuma pergunta publicada
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  Cadastre perguntas em{" "}
                  <Link
                    href="/admin/perguntas"
                    className="font-bold text-brand-600 underline"
                  >
                    Gerenciar perguntas
                  </Link>{" "}
                  para começar a receber respostas.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {stats.questions.map((item, index) => {
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
            )}

            <ChartCard
              title="Respostas por dia"
              subtitle="Volume de participação ao longo do tempo"
            >
              <Timeline data={stats.perDay} />
            </ChartCard>
          </motion.div>
        ) : (
          <motion.div
            key="respostas"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <div className="relative mb-5">
              <SearchIcon className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome, e-mail ou qualquer resposta..."
                className="w-full rounded-2xl border-2 border-brand-100 bg-white/85 py-3.5 pr-4 pl-11 text-sm outline-none transition-all placeholder:text-ink-300 focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(115,80,240,0.14)]"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="glass-card rounded-2xl px-6 py-14 text-center text-sm font-semibold text-ink-300">
                {responses.length === 0
                  ? "Nenhuma resposta recebida ainda."
                  : "Nenhuma resposta encontrada para essa busca."}
              </p>
            ) : (
              <ul className="space-y-3">
                {filtered.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index, 12) * 0.035 }}
                  >
                    <Link
                      href={`/admin/respostas/${item.id}`}
                      className="glass-card group flex flex-wrap items-center gap-4 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-brand-400"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-black text-white">
                        {item.name.trim().charAt(0).toUpperCase()}
                      </span>

                      <div className="min-w-[11rem] flex-1">
                        <p className="text-sm font-extrabold text-ink-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-ink-500">{item.email}</p>
                      </div>

                      {headline && (
                        <div className="min-w-[10rem] flex-1">
                          <p className="text-[0.68rem] font-bold tracking-wide text-ink-300 uppercase">
                            {headline.title.slice(0, 28)}
                          </p>
                          <p className="text-xs font-semibold text-ink-700">
                            {formatAnswer(headline, item.answers[headline.id]) ||
                              "—"}
                          </p>
                        </div>
                      )}

                      <div className="text-right">
                        <p className="text-[0.68rem] font-bold tracking-wide text-ink-300 uppercase">
                          Enviada em
                        </p>
                        <p className="text-xs font-semibold text-ink-500">
                          {new Date(item.createdAt).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>

                      <span className="text-xs font-bold text-brand-500 transition-transform group-hover:translate-x-1">
                        Ver →
                      </span>
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
