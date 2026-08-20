import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "vj_admin";
const SESSION_HOURS = 8;

function secret(): string {
  return (
    process.env.ADMIN_SECRET ??
    process.env.ADMIN_PASSWORD ??
    "voz-jovem-dev-secret"
  );
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

export function createSessionToken(): { token: string; maxAge: number } {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(expiresAt);
  return {
    token: `${payload}.${sign(payload)}`,
    maxAge: SESSION_HOURS * 60 * 60,
  };
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload))) return false;
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Usado nas páginas do painel: manda para o login se a sessão não for válida. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
