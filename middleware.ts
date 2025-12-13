import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🚨 ABSOLUTE BYPASS FOR API ROUTES
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const session = req.cookies.get("session")?.value;

  const isAuthRoute =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  // 🚫 Not logged in and trying to access protected pages → go to sign-in
  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // ✅ Already logged in and trying to access auth pages → go to home
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
