import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar no painel | Voz Jovem" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="grid min-h-dvh place-items-center bg-brand-900 px-5 py-12">
      <LoginForm />
    </main>
  );
}
