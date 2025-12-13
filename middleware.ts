import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const session = req.cookies.get("session")?.value
  const { pathname } = req.nextUrl

  const isAuthRoute =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")

  // 🚫 Not logged in and trying to access protected pages → go to sign-in
  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  // ✅ Already logged in and trying to access auth pages → go to home
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // ✅ Otherwise, allow the request
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico).*)",
  ],
};
