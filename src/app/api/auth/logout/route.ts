import { NextResponse } from "next/server";

const AUTH_COOKIE = "vida_total_auth";

export async function POST() {
  const response = NextResponse.redirect(new URL("/signup", new URL("/api/auth/logout", "http://localhost:3000")), {
    status: 303,
  });
  
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  
  return response;
}
