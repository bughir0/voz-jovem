import Link from "next/link";
import { notFound } from "next/navigation";
import { ResponseDetail } from "@/components/admin/ResponseDetail";
import { requireAdmin } from "@/lib/auth";
import { getResponse, listQuestions } from "@/lib/db";

export const metadata = { title: "Resposta individual | Voz Jovem" };
export const dynamic = "force-dynamic";

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const [response, questions] = await Promise.all([
    getResponse(id),
    listQuestions({ includeArchived: true }),
  ]);
  if (!response) notFound();

  return (
    <main className="min-h-dvh">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/admin"
          className="no-print mb-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-800"
        >
          ← Voltar ao painel
        </Link>
        <ResponseDetail response={response} questions={questions} />
      </div>
    </main>
  );
}
