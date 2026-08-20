"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

type Props = {
  valor: number;
  decimais?: number;
  sufixo?: string;
};

export function CountUp({ valor, decimais = 0, sufixo = "" }: Props) {
  const progresso = useMotionValue(0);
  const texto = useTransform(
    progresso,
    (atual) =>
      `${atual.toLocaleString("pt-BR", {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais,
      })}${sufixo}`,
  );

  useEffect(() => {
    const controles = animate(progresso, valor, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return () => controles.stop();
  }, [progresso, valor]);

  return <motion.span>{texto}</motion.span>;
}
