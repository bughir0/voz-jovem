import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteResponse, getResponse } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getResponse(id);
  if (!existing) {
    return NextResponse.json(
      { error: "Resposta não encontrada." },
      { status: 404 },
    );
  }

  await deleteResponse(id);
  return NextResponse.json({ ok: true });
}
