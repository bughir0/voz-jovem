import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const serifDisplay = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Voz Jovem | Pesquisa sobre os desafios da juventude",
  description:
    "Uma pesquisa rápida para entender quais problemas mais afetam os jovens e o que pode ser feito para mudar essa realidade.",
};

export const viewport: Viewport = {
  themeColor: "#0f2338",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${serifDisplay.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
