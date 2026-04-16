// middleware.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const PUBLIC = [
  "/", "/pricing", "/features", "/about", "/contact", "/demo", "/faq",
]

export default auth(function middleware(req: any) {
  const pathname = req.nextUrl.pathname
  const isAuthenticated = !!req.auth?.user

  // Always pass through
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/legal/") ||
    pathname.startsWith("/portal/") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|map)$/) ||
    PUBLIC.includes(pathname)
  ) {
    return NextResponse.next()
  }

  // Require auth for everything else
  if (!isAuthenticated) {
    const url = new URL("/auth/sign-in", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
}
