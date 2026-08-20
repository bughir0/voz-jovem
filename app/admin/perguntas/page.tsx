import { AuroraBackground } from "@/components/AuroraBackground";
import { QuestionManager } from "@/components/admin/QuestionManager";
import { requireAdmin } from "@/lib/auth";
import { listQuestions } from "@/lib/db";

export const metadata = { title: "Perguntas | Voz Jovem" };
export const dynamic = "force-dynamic";

export default async function ManageQuestionsPage() {
  await requireAdmin();

  const questions = await listQuestions({ includeArchived: true });

  return (
    <main className="relative min-h-screen">
      <AuroraBackground />
      <QuestionManager questions={questions} />
    </main>
  );
}
