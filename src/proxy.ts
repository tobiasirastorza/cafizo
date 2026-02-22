import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "kinetic_auth";

function isPublicPath(pathname: string) {
  return (
    pathname === "/signup" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAuthed = request.cookies.get(AUTH_COOKIE)?.value === "1";

  if (isPublicPath(pathname)) {
    if (pathname === "/signup" && isAuthed) {
      return NextResponse.redirect(new URL("/students", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthed) {
    const next = `${pathname}${search}`;
    const url = new URL("/signup", request.url);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
