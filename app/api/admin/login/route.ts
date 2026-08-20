import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, createSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      {
        error:
          "ADMIN_PASSWORD não está configurada. Defina-a no arquivo .env.local.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    password?: unknown;
  };
  const password = typeof body.password === "string" ? body.password : "";

  if (!checkPassword(password)) {
    // Atraso curto para tornar tentativas em massa menos eficientes.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const { token, maxAge } = createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
