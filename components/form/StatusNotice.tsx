import Link from "next/link";

/** Tela que substitui o formulário quando ele não está recebendo respostas. */
export function StatusNotice({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-brand-900 px-5 text-center text-white">
      <div className="animate-fade-up max-w-md">
        <span className="eyebrow text-brand-300">Pesquisa Voz Jovem</span>
        <h1 className="display mt-4 text-[clamp(1.75rem,6vw,2.5rem)]">
          {title}
        </h1>
        <p className="mt-4 leading-relaxed text-brand-200">{text}</p>
        <Link
          href="/admin"
          className="mt-8 inline-block text-xs font-semibold text-brand-300 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Painel da organização
        </Link>
      </div>
    </main>
  );
}
