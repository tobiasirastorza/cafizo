import { NextResponse } from "next/server";

const AUTH_COOKIE = "vida_total_auth";
const USERNAME = "khafizo";
const PASSWORD = "khafizo";

export async function POST(req: Request) {
  const formData = await req.formData();
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/students");

  if (username !== USERNAME || password !== PASSWORD) {
    return NextResponse.redirect(new URL(`/signup?error=1`, req.url), {
      status: 303,
    });
  }

  const isSafeNextPath = nextPath.startsWith("/") && !nextPath.startsWith("//");
  const destination = isSafeNextPath ? nextPath : "/students";

  const response = NextResponse.redirect(new URL(destination, req.url), {
    status: 303,
  });
  response.cookies.set(AUTH_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
