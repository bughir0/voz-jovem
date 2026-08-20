"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertIcon, LockIcon, SpinnerIcon } from "@/components/icons";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Não foi possível entrar.");
      }
      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Erro ao entrar.",
      );
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card w-full max-w-sm rounded-[1.75rem] p-8"
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
        className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow"
      >
        <LockIcon className="h-7 w-7" />
      </motion.div>

      <h1 className="text-center text-2xl font-black tracking-tight text-ink-900">
        Painel da pesquisa
      </h1>
      <p className="mt-2 mb-6 text-center text-sm text-ink-500">
        Área restrita à organização. Informe a senha de acesso.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          autoFocus
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha do painel"
          className="w-full rounded-2xl border-2 border-brand-100 bg-white/85 px-4 py-3.5 text-base outline-none transition-all placeholder:text-ink-300 focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(115,80,240,0.14)]"
        />

        {error && (
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 rounded-xl bg-accent-500/10 px-3.5 py-2.5 text-xs font-semibold text-accent-500"
          >
            <AlertIcon className="h-4 w-4 shrink-0" />
            {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={loading || !password}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-3.5 text-sm font-bold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <SpinnerIcon className="h-4 w-4 animate-spin" />}
          {loading ? "Entrando..." : "Entrar"}
        </motion.button>
      </form>
    </motion.div>
  );
}
