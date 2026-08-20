"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

type Props = {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  hint?: string;
  accent: string;
  delay?: number;
  icon?: React.ReactNode;
};

export function StatCard({
  label,
  value,
  suffix = "",
  decimals = 0,
  hint,
  accent,
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
      duration: 1.1,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [delay, progress, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="glass-card relative overflow-hidden rounded-2xl p-5"
    >
      <span
        className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-25 blur-2xl"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-ink-500 uppercase">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-ink-900">
            <motion.span>{display}</motion.span>
            {suffix}
          </p>
          {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
        </div>
        {icon && (
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
            style={{ background: accent }}
          >
            {icon}
          </span>
        )}
      </div>
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
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-card rounded-2xl p-5 sm:p-6 ${className}`}
    >
      <h3 className="text-base font-extrabold tracking-tight text-ink-900">
        {title}
      </h3>
      {subtitle && <p className="mt-1 mb-4 text-xs text-ink-500">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-4"}>{children}</div>
    </motion.section>
  );
}
