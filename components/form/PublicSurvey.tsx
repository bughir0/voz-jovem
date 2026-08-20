"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FORM_STATUS_CHANNEL } from "@/lib/form-status-sync";
import {
  FORM_STATUS_NOTICE,
  isFormStatus,
  type FormStatus,
  type Question,
} from "@/lib/types";
import { FormFlow } from "./FormFlow";
import { StatusNotice } from "./StatusNotice";

const POLL_MS = 4000;

function useLiveFormStatus(initial: FormStatus): FormStatus {
  const [status, setStatus] = useState(initial);

  useEffect(() => setStatus(initial), [initial]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/form-status", { cache: "no-store" });
        const body = (await response.json()) as { status?: unknown };
        if (!cancelled && isFormStatus(body.status)) setStatus(body.status);
      } catch {
        // Sem rede, mantém o último estado conhecido.
      }
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void refresh();
    }

    const channel = new BroadcastChannel(FORM_STATUS_CHANNEL);
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (isFormStatus(event.data)) setStatus(event.data);
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      channel.close();
    };
  }, []);

  return status;
}

export function PublicSurvey({
  questions,
  initialStatus,
}: {
  questions: Question[];
  initialStatus: FormStatus;
}) {
  const status = useLiveFormStatus(initialStatus);

  let screen: React.ReactNode;
  if (status !== "open") {
    const notice = FORM_STATUS_NOTICE[status];
    screen = <StatusNotice title={notice.title} text={notice.text} />;
  } else if (questions.length === 0) {
    screen = (
      <StatusNotice
        title="A pesquisa está sendo preparada"
        text="Nenhuma pergunta está publicada no momento. Volte em breve para participar."
      />
    );
  } else {
    screen = (
      <main>
        <FormFlow questions={questions} />
      </main>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
      >
        {screen}
      </motion.div>
    </AnimatePresence>
  );
}
