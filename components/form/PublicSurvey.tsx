"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  FORM_STATUS_NOTICE,
  questionsRevision,
  type FormStatus,
  type Question,
} from "@/lib/types";
import { useLiveSurvey } from "@/lib/use-live-survey";
import { FormFlow } from "./FormFlow";
import { QuestionsChangedModal } from "./QuestionsChangedModal";
import { StatusNotice } from "./StatusNotice";

const AUTO_RESTART_MS = 4000;

export function PublicSurvey({
  questions,
  initialStatus,
}: {
  questions: Question[];
  initialStatus: FormStatus;
}) {
  const initialRevision = questionsRevision(questions);
  const live = useLiveSurvey({
    status: initialStatus,
    questions,
    revision: initialRevision,
  });

  const [shown, setShown] = useState(live);
  const liveRef = useRef(live);
  liveRef.current = live;
  const pending = live.revision !== shown.revision;

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(
      () => setShown(liveRef.current),
      AUTO_RESTART_MS,
    );
    return () => window.clearTimeout(timer);
  }, [live.revision, pending]);

  let screen: React.ReactNode;
  if (shown.status !== "open") {
    const notice = FORM_STATUS_NOTICE[shown.status];
    screen = <StatusNotice title={notice.title} text={notice.text} />;
  } else if (shown.questions.length === 0) {
    screen = (
      <StatusNotice
        title="A pesquisa está sendo preparada"
        text="Nenhuma pergunta está publicada no momento. Volte em breve para participar."
      />
    );
  } else {
    screen = (
      <main>
        <FormFlow
          key={shown.revision}
          questions={shown.questions}
          formStatus={live.status}
        />
      </main>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${shown.status}:${shown.revision}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          {screen}
        </motion.div>
      </AnimatePresence>

      {pending && live.status === "open" && (
        <QuestionsChangedModal onRestart={() => setShown(live)} />
      )}
    </>
  );
}
