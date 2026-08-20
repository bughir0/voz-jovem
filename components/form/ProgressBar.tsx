"use client";

import { motion } from "motion/react";

export function ProgressBar({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between text-xs font-semibold text-ink-500">
        <span className="tracking-[0.14em] uppercase">{label}</span>
        <motion.span
          key={percent}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-brand-600"
        >
          {percent}%
        </motion.span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100/80">
        <motion.div
          className="relative h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-400 to-accent-500"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <span
            className="animate-shimmer absolute inset-0 rounded-full"
            style={{
              backgroundImage:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)",
              backgroundSize: "200% 100%",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
