"use client";

import { useLiveSurvey } from "@/lib/use-live-survey";
import type { FormStatus } from "@/lib/types";

/** Atalho quando só a situação aberto/pausado/fechado importa. */
export function useLiveFormStatus(initial: FormStatus): FormStatus {
  return useLiveSurvey({
    status: initial,
    revision: "",
    questions: [],
  }).status;
}
