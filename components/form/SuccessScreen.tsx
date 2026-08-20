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
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="grid min-h-dvh place-items-center bg-brand-900 px-5 py-16 text-white"
      >
        <div className="w-full max-w-lg text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-white/25"
          >
            <svg viewBox="0 0 52 52" className="h-10 w-10" aria-hidden>
              <motion.path
                d="M14 27l8.5 8.5L38 19"
                fill="none"
                stroke="white"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
              />
            </svg>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="display mt-8 text-[clamp(1.75rem,6vw,2.75rem)]"
          >
            Resposta enviada{firstName ? `, ${firstName}` : ""}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mx-auto mt-4 max-w-md leading-relaxed text-brand-200"
          >
            Obrigado por participar. Sua opinião entra agora no relatório da
            pesquisa e vai ajudar a definir quais problemas serão priorizados.
          </motion.p>

          <motion.button
            type="button"
            onClick={onRestart}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.5 }}
            whileTap={{ scale: 0.98 }}
            className="mt-10 inline-flex min-h-12 cursor-pointer items-center rounded-xl border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-brand-900"
          >
            Enviar outra resposta
          </motion.button>
        </div>
      </motion.section>
    </>
  );
}
