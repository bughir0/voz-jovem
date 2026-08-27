import { PublicSurvey } from "@/components/form/PublicSurvey";
import { getSurveySnapshot } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const snapshot = await getSurveySnapshot();

  return (
    <PublicSurvey
      questions={snapshot.questions}
      initialStatus={snapshot.status}
    />
  );
}
