"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

type Props = {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  hint?: string;
  delay?: number;
  icon?: React.ReactNode;
};

export function StatCard({
  label,
  value,
  suffix = "",
  decimals = 0,
  hint,
  delay = 0,
  icon,
}: Props) {
  const progress = useMotionValue(0);
  const display = useTransform(progress, (current) =>
    current.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  );

  useEffect(() => {
    const controls = animate(progress, value, {
      duration: 1,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [delay, progress, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="card rounded-xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow text-ink-500">{label}</p>
        {icon && <span className="shrink-0 text-ink-300">{icon}</span>}
      </div>

      <p className="display tnum mt-3 text-3xl text-ink-900">
        <motion.span>{display}</motion.span>
        {suffix}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </motion.div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
  delay = 0,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`card rounded-xl p-5 sm:p-6 ${className}`}
    >
      <h3 className="text-base leading-snug font-semibold text-ink-900">
        {title}
      </h3>
      {subtitle && <p className="mt-1 mb-4 text-xs text-ink-500">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-4"}>{children}</div>
    </motion.section>
  );
}
