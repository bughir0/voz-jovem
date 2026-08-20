import { PublicSurvey } from "@/components/form/PublicSurvey";
import { getFormStatus, listQuestions } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [questions, status] = await Promise.all([
    listQuestions(),
    getFormStatus(),
  ]);

  return <PublicSurvey questions={questions} initialStatus={status} />;
}
