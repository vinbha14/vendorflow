// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ROUTES } from "@/config/constants"
import { auth } from "@/lib/auth"

const PUBLIC_PATHS = [
  "/",
  "/auth",
  "/api/auth",
  "/features",
  "/pricing",
  "/about",
  "/contact",
  "/demo",
  "/faq",
  "/legal",
  "/portal",
  "/api/webhooks",
  "/_next",
  "/favicon",
  "/robots",
  "/sitemap",
]

const AUTH_PATHS = ["/auth/sign-in", "/auth/sign-up"]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?")
  )
}

export default auth(async function middleware(req) {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|map)$/)
  ) {
    return NextResponse.next()
  }

  // Always allow NextAuth API routes through
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const session = (req as NextRequest & { auth?: { user?: { id: string; globalRole?: string } } }).auth
  const isAuthenticated = !!session?.user
  const userRole = session?.user?.globalRole

  // Already signed in — redirect away from auth pages
  if (isAuthenticated && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const destination = userRole === "SUPER_ADMIN" ? ROUTES.ADMIN : ROUTES.DASHBOARD
    return NextResponse.redirect(new URL(destination, req.url))
  }

  // Public routes — allow through
  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // Protected route — not authenticated
  if (!isAuthenticated) {
    const signInUrl = new URL(ROUTES.SIGN_IN, req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Super admin routes
  if (pathname.startsWith("/admin")) {
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(ROUTES.DASHBOARD, req.url))
    }
  }

  // Redirect super admin away from dashboard/onboarding
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    if (userRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(ROUTES.ADMIN, req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf|map)).*)",
  ],
}
