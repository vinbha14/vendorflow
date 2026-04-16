// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

export default auth(function middleware(req) {
  const { nextUrl } = req
  const pathname = nextUrl.pathname
  const session = (req as any).auth
  const isAuthenticated = !!session?.user

  // Always allow these through — no exceptions
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/api/webhooks") ||
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/features" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|map)$/)
  ) {
    return NextResponse.next()
  }

  // Protected routes — require auth
  if (!isAuthenticated) {
    const signInUrl = new URL("/auth/sign-in", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Authenticated — let through
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
}
