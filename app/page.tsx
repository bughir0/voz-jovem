import Link from "next/link";
import { AuroraBackground } from "@/components/AuroraBackground";
import { FormFlow } from "@/components/form/FormFlow";
import { listQuestions } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const questions = await listQuestions();

  return (
    <main className="relative min-h-screen">
      <AuroraBackground />

      <Link
        href="/admin"
        className="fixed top-4 right-4 z-40 rounded-full border border-brand-200 bg-white/70 px-4 py-2 text-xs font-bold text-brand-600 backdrop-blur transition-colors hover:border-brand-400 hover:bg-white"
      >
        Painel admin
      </Link>

      {questions.length === 0 ? (
        <div className="mx-auto w-full max-w-xl px-5 py-24 text-center">
          <div className="glass-card rounded-[1.75rem] p-8">
            <h1 className="text-2xl font-black tracking-tight text-ink-900">
              A pesquisa está sendo preparada
            </h1>
            <p className="mt-3 text-sm text-ink-500">
              Nenhuma pergunta está publicada no momento. Volte em breve para
              participar.
            </p>
          </div>
        </div>
      ) : (
        <FormFlow questions={questions} />
      )}
    </main>
  );
}
