"use client";

import { motion } from "motion/react";
import { ArrowRightIcon, SparkIcon } from "@/components/icons";

export function Hero({
  onStart,
  total,
}: {
  onStart: () => void;
  total: number;
}) {
  const highlights = [
    {
      title: `${total} ${total === 1 ? "pergunta" : "perguntas"}`,
      text: "Leva poucos minutos",
    },
    { title: "Dados protegidos", text: "Usados só para a pesquisa" },
    { title: "Sua voz conta", text: "Ajuda a definir prioridades" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-3xl px-5 py-14 text-center sm:py-20"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="animate-float mx-auto mb-7 grid h-20 w-20 place-items-center rounded-[1.6rem] bg-gradient-to-br from-brand-500 via-brand-400 to-accent-500 text-white shadow-glow"
      >
        <SparkIcon className="h-10 w-10" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5 }}
        className="mb-4 inline-block rounded-full border border-brand-200 bg-white/70 px-4 py-1.5 text-xs font-bold tracking-[0.16em] text-brand-600 uppercase"
      >
        Pesquisa Juventude
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl leading-[1.05] font-black tracking-tight text-ink-900 sm:text-6xl"
      >
        Qual problema mais{" "}
        <span className="text-gradient">afeta os jovens</span> na sua realidade?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.6 }}
        className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg"
      >
        Responda {total} {total === 1 ? "pergunta" : "perguntas"} e ajude a
        mapear os desafios da juventude na sua comunidade. As respostas serão
        usadas para escolher as prioridades do projeto.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.5 }}
        className="mt-9"
      >
        <motion.button
          type="button"
          onClick={onStart}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="group inline-flex cursor-pointer items-center gap-3 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 px-9 py-4 text-base font-bold text-white shadow-glow"
        >
          Começar a responder
          <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </motion.button>
        <p className="mt-3 text-xs font-semibold text-ink-300">
          Ou pressione Enter
        </p>
      </motion.div>

      <div className="mt-14 grid gap-3 sm:grid-cols-3">
        {highlights.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5 }}
            className="glass-card rounded-2xl px-5 py-4 text-left"
          >
            <p className="text-sm font-extrabold text-ink-900">{item.title}</p>
            <p className="mt-0.5 text-xs text-ink-500">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
