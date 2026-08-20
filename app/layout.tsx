import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voz Jovem | Pesquisa sobre os desafios da juventude",
  description:
    "Uma pesquisa rápida para entender quais problemas mais afetam os jovens e o que pode ser feito para mudar essa realidade.",
};

export const viewport: Viewport = {
  themeColor: "#7350f0",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
