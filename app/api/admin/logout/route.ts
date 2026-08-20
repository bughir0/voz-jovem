import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
