import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getFormStatus, setFormStatus } from "@/lib/db";
import { isFormStatus } from "@/lib/types";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return NextResponse.json({ status: await getFormStatus() });
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const status = (payload as { status?: unknown })?.status;
  if (!isFormStatus(status)) {
    return NextResponse.json(
      { error: "Situação inválida para o formulário." },
      { status: 400 },
    );
  }

  await setFormStatus(status);
  return NextResponse.json({ ok: true, status });
}
