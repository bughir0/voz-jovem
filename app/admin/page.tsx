import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { requireAdmin } from "@/lib/auth";
import { getFormStatus, listQuestions, listResponses } from "@/lib/db";
import { buildStats } from "@/lib/stats";

export const metadata = { title: "Painel | Voz Jovem" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [questions, responses, formStatus] = await Promise.all([
    listQuestions(),
    listResponses(),
    getFormStatus(),
  ]);
  const stats = buildStats(questions, responses);

  return (
    <main className="min-h-dvh">
      <AdminDashboard
        responses={responses}
        stats={stats}
        formStatus={formStatus}
      />
    </main>
  );
}
