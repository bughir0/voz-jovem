import { FormFlow } from "@/components/form/FormFlow";
import { StatusNotice } from "@/components/form/StatusNotice";
import { getFormStatus, listQuestions } from "@/lib/db";
import { FORM_STATUS_NOTICE } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [questions, status] = await Promise.all([
    listQuestions(),
    getFormStatus(),
  ]);

  if (status !== "open") {
    const notice = FORM_STATUS_NOTICE[status];
    return <StatusNotice title={notice.title} text={notice.text} />;
  }

  if (questions.length === 0) {
    return (
      <StatusNotice
        title="A pesquisa está sendo preparada"
        text="Nenhuma pergunta está publicada no momento. Volte em breve para participar."
      />
    );
  }

  return (
    <main>
      <FormFlow questions={questions} />
    </main>
  );
}
