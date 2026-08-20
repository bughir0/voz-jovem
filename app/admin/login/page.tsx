import { redirect } from "next/navigation";
import { AuroraBackground } from "@/components/AuroraBackground";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar no painel | Voz Jovem" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="relative grid min-h-screen place-items-center px-5">
      <AuroraBackground />
      <LoginForm />
    </main>
  );
}
