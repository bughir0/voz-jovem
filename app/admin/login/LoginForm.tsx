"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertIcon, SpinnerIcon } from "@/components/icons";

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm rounded-2xl bg-surface p-7 sm:p-8"
    >
      <span className="eyebrow text-brand-600">Voz Jovem</span>
      <h1 className="display mt-2 text-2xl text-ink-900">Painel da pesquisa</h1>
      <p className="mt-2 text-sm text-ink-500">
        Área restrita à organização. Informe a senha de acesso.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <label htmlFor="admin-password" className="sr-only">
          Senha do painel
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          autoFocus
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha do painel"
          className="field-base focus:field-base-focus min-h-13 px-4 py-3.5 placeholder:text-ink-300"
        />

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2 rounded-lg border border-danger-500/25 bg-danger-50 px-3.5 py-2.5 text-xs font-medium text-danger-600"
          >
            <AlertIcon className="mt-px h-4 w-4 shrink-0" />
            {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={loading || !password}
          whileTap={{ scale: 0.99 }}
          className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <SpinnerIcon className="h-4 w-4 animate-spin" />}
          {loading ? "Entrando..." : "Entrar"}
        </motion.button>
      </form>
    </motion.div>
  );
}
