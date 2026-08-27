"use client";

import { useEffect, useState } from "react";
import { FORM_STATUS_CHANNEL } from "@/lib/form-status-sync";
import { isFormStatus, type FormStatus, type Question } from "@/lib/types";

export type SurveySnapshot = {
  status: FormStatus;
  revision: string;
  questions: Question[];
};

const POLL_MS = 1500;

function isSnapshot(value: unknown): value is SurveySnapshot {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return (
    isFormStatus(body.status) &&
    typeof body.revision === "string" &&
    Array.isArray(body.questions)
  );
}

async function readSnapshot(): Promise<SurveySnapshot | null> {
  const response = await fetch(`/api/form-status?t=${Date.now()}`, {
    cache: "no-store",
    headers: { Pragma: "no-cache" },
  });
  const body: unknown = await response.json();
  return isSnapshot(body) ? body : null;
}

/** Acompanha situação e perguntas enquanto a pessoa está na página. */
export function useLiveSurvey(initial: SurveySnapshot): SurveySnapshot {
  const [snapshot, setSnapshot] = useState(initial);

  useEffect(() => {
    let cancelled = false;

    function apply(value: unknown) {
      if (!cancelled && isSnapshot(value)) setSnapshot(value);
    }

    async function poll() {
      try {
        const next = await readSnapshot();
        if (next) apply(next);
      } catch {
        // Sem rede, mantém o último estado conhecido.
      }
    }

    void poll();
    const interval = window.setInterval(() => void poll(), POLL_MS);

    const stream = new EventSource("/api/form-status/stream");
    stream.onmessage = (event) => {
      try {
        apply(JSON.parse(event.data));
      } catch {
        // Pacote inválido: o próximo poll cobre.
      }
    };

    const channel = new BroadcastChannel(FORM_STATUS_CHANNEL);
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const status = event.data;
      if (!isFormStatus(status)) return;
      setSnapshot((previous) =>
        previous.status === status ? previous : { ...previous, status },
      );
    };

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      stream.close();
      channel.close();
    };
  }, []);

  return snapshot;
}
