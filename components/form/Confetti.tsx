"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

const COLORS = ["#7350f0", "#f0479f", "#35d6b0", "#ffb43d", "#8f76fb"];

type Piece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  color: string;
  round: boolean;
};

export function Confetti({ count = 70 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  // Gerado apenas no cliente para não divergir do HTML renderizado no servidor.
  useEffect(() => {
    setPieces(
      Array.from({ length: count }, (_, id) => ({
        id,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 2.4 + Math.random() * 2.2,
        size: 7 + Math.random() * 9,
        rotation: Math.random() * 720 - 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        round: Math.random() > 0.6,
      })),
    );
  }, [count]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{ y: "-12vh", opacity: 0, rotate: 0 }}
          animate={{
            y: "112vh",
            opacity: [0, 1, 1, 0],
            rotate: piece.rotation,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeIn",
            times: [0, 0.1, 0.8, 1],
          }}
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.round ? piece.size : piece.size * 0.45,
            background: piece.color,
            borderRadius: piece.round ? 999 : 2,
          }}
          className="absolute top-0"
        />
      ))}
    </div>
  );
}
