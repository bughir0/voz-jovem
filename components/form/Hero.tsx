"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

export function Hero({
  onStart,
  total,
}: {
  onStart: () => void;
  total: number;
}) {
  const reduced = useReducedMotion();

  const facts = [
    {
      title: `${total} ${total === 1 ? "pergunta" : "perguntas"}`,
      text: "Cerca de 3 minutos para responder",
    },
    { title: "Resposta anônima", text: "Não pedimos nome nem e-mail" },
    { title: "Resultado público", text: "Define as prioridades do projeto" },
  ];

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-dvh flex-col bg-brand-900 text-white"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 py-16 sm:px-8 sm:py-24">
        <motion.div {...rise(0)} className="flex items-center gap-3">
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="block h-px w-10 origin-left bg-brand-400"
          />
          <span className="eyebrow text-brand-300">Pesquisa Voz Jovem</span>
        </motion.div>

        <motion.h1
          {...rise(0.08)}
          className="display mt-6 text-[clamp(2.25rem,8vw,4.25rem)] text-white"
        >
          Qual problema mais afeta os jovens na sua realidade?
        </motion.h1>

        <motion.p
          {...rise(0.16)}
          className="mt-6 max-w-xl text-base leading-relaxed text-brand-200 sm:text-lg"
        >
          Responda {total} {total === 1 ? "pergunta" : "perguntas"} e ajude a
          mapear os desafios da juventude na sua comunidade. As respostas
          definem quais problemas o projeto vai priorizar.
        </motion.p>

        <motion.div
          {...rise(0.24)}
          className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
        >
          <motion.button
            type="button"
            onClick={onStart}
            whileHover={reduced ? undefined : { y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="group inline-flex w-full min-h-13 cursor-pointer items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-semibold text-brand-900 sm:w-auto"
          >
            Começar a responder
            <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </motion.button>
          <p className="hidden text-sm text-brand-300 sm:block">
            ou pressione Enter
          </p>
        </motion.div>

        <motion.dl
          {...rise(0.34)}
          className="mt-16 grid gap-px overflow-hidden border-y border-white/12 sm:grid-cols-3"
        >
          {facts.map((fact) => (
            <div
              key={fact.title}
              className="border-b border-white/12 py-5 last:border-b-0 sm:border-b-0 sm:pr-6"
            >
              <dt className="text-sm font-semibold text-white">{fact.title}</dt>
              <dd className="mt-1 text-sm text-brand-300">{fact.text}</dd>
            </div>
          ))}
        </motion.dl>
      </div>

      <motion.footer
        {...rise(0.46)}
        className="border-t border-white/10 px-5 py-5 sm:px-8"
      >
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4">
          <p className="text-xs text-brand-400">
            Pesquisa conduzida pela organização Voz Jovem
          </p>
          <Link
            href="/admin"
            className="text-xs font-semibold text-brand-300 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Painel da organização
          </Link>
        </div>
      </motion.footer>
    </motion.section>
  );
}
