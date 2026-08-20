"use client";

import { motion } from "motion/react";
import { Confetti } from "./Confetti";

export function SuccessScreen({
  name,
  onRestart,
}: {
  name: string;
  onRestart: () => void;
}) {
  const firstName = name.trim().split(/\s+/)[0] ?? "";

  return (
    <>
      <Confetti />
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-xl px-5 py-16 text-center sm:py-24"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-mint-400 to-brand-500 shadow-glow"
        >
          <svg viewBox="0 0 52 52" className="h-12 w-12" aria-hidden>
            <motion.path
              d="M14 27l8.5 8.5L38 19"
              fill="none"
              stroke="white"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.25, duration: 0.55, ease: "easeOut" }}
            />
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-3xl font-black tracking-tight text-ink-900 sm:text-4xl"
        >
          Resposta enviada{firstName ? `, ${firstName}` : ""}!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mx-auto mt-4 max-w-md leading-relaxed text-ink-500"
        >
          Obrigado por participar. Sua opinião entra agora no relatório da
          pesquisa e vai ajudar a definir quais problemas serão priorizados.
        </motion.p>

        <motion.button
          type="button"
          onClick={onRestart}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-9 cursor-pointer rounded-full border-2 border-brand-200 bg-white/80 px-7 py-3 text-sm font-bold text-brand-600 transition-colors hover:border-brand-400 hover:bg-white"
        >
          Enviar outra resposta
        </motion.button>
      </motion.div>
    </>
  );
}
