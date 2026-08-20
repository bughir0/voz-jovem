import { AuroraBackground } from "@/components/AuroraBackground";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { requireAdmin } from "@/lib/auth";
import { listQuestions, listResponses } from "@/lib/db";
import { buildStats } from "@/lib/stats";

export const metadata = { title: "Painel | Voz Jovem" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [questions, responses] = await Promise.all([
    listQuestions(),
    listResponses(),
  ]);
  const stats = buildStats(questions, responses);

  return (
    <main className="relative min-h-screen">
      <AuroraBackground />
      <AdminDashboard responses={responses} stats={stats} />
    </main>
  );
}
