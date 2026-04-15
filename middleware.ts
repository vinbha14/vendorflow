// middleware.ts
// Next.js middleware — runs on every request at the edge.
// Responsibilities:
//   1. Resolve tenant from subdomain → inject headers
//   2. Auth guard for protected routes
//   3. Role-based redirects (super admin → /admin, etc.)

import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { TENANT_HEADERS, RESERVED_SUBDOMAINS } from "@/types/tenant"
import { ROUTES } from "@/config/constants"

// Routes that never need auth
const PUBLIC_PATHS = [
  "/",
  "/auth",             // sign-in, sign-up, error, verify-email
  "/features",
  "/pricing",
  "/about",
  "/contact",
  "/demo",
  "/faq",
  "/legal",
  "/portal",           // company branded pages — public
  "/api/webhooks",     // Stripe webhooks — no auth
  "/_next",
  "/favicon",
  "/robots",
  "/sitemap",
]

// Auth pages — redirect away if already signed in
const AUTH_PATHS = ["/auth/sign-in", "/auth/sign-up"]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?"))
}

export default auth(async function middleware(req) {
  const { nextUrl } = req
  const hostname = req.headers.get("host") ?? ""
  const pathname = nextUrl.pathname

  // ─── Skip Next.js internals and static files ────────────────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|map)$/)
  ) {
    return NextResponse.next()
  }

  // ─── Subdomain resolution ───────────────────────────────────────────────
  const appDomain = process.env["NEXT_PUBLIC_APP_DOMAIN"] ?? "localhost:3000"
  const isLocalhost = hostname.includes("localhost")

  let tenantSlug: string | null = null

  if (!isLocalhost) {
    // Production: extract subdomain from hostname
    // e.g. "techcorp-india.vendorflow.com" → "techcorp-india"
    const withoutApex = hostname.replace(`.${appDomain}`, "")
    if (
      withoutApex !== hostname && // it actually had the domain
      withoutApex !== "www" &&
      !RESERVED_SUBDOMAINS.includes(withoutApex as never)
    ) {
      tenantSlug = withoutApex
    }
  } else {
    // Local dev: support ?tenant=slug query param OR x-tenant-slug header
    // to simulate subdomains without real DNS
    tenantSlug =
      nextUrl.searchParams.get("tenant") ??
      req.headers.get("x-tenant-slug") ??
      null
  }

  // ─── Build response headers ────────────────────────────────────────────
  const requestHeaders = new Headers(req.headers)

  if (tenantSlug) {
    requestHeaders.set(TENANT_HEADERS.TENANT_SLUG, tenantSlug)
    requestHeaders.set(TENANT_HEADERS.IS_TENANT, "true")

    // Rewrite portal routes to /portal/[slug]
    if (
      !pathname.startsWith("/dashboard") &&
      !pathname.startsWith("/vendor") &&
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/auth") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/onboarding") &&
      !pathname.startsWith("/portal")
    ) {
      const url = nextUrl.clone()
      url.pathname = `/portal/${tenantSlug}${pathname === "/" ? "" : pathname}`
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    }
  }

  // ─── Resolve tenantId from slug (set as header for server components) ──
  // We do a lightweight lookup here. The full company object is fetched
  // in the layout/page using getTenantFromHeaders().
  if (tenantSlug) {
    // We pass the slug; the DB lookup happens in server components via lib/tenant.ts
    // This keeps middleware fast (no DB call on every request)
    requestHeaders.set(TENANT_HEADERS.TENANT_SLUG, tenantSlug)
  }

  // ─── Auth session ───────────────────────────────────────────────────────
  // `req.auth` is injected by Auth.js's `auth()` wrapper
  const session = (req as NextRequest & { auth?: { user?: { id: string; globalRole?: string; email?: string } } }).auth
  const isAuthenticated = !!session?.user
  const userRole = session?.user?.globalRole

  // ─── Already authenticated → redirect away from auth pages ────────────
  if (isAuthenticated && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const destination =
      userRole === "SUPER_ADMIN" ? ROUTES.ADMIN : ROUTES.DASHBOARD
    return NextResponse.redirect(new URL(destination, req.url))
  }

  // ─── Public routes — allow through ─────────────────────────────────────
  if (isPublic(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ─── Protected route — not authenticated ───────────────────────────────
  if (!isAuthenticated) {
    const signInUrl = new URL(ROUTES.SIGN_IN, req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // ─── Role-based access control ─────────────────────────────────────────

  // Super admin routes — SUPER_ADMIN only
  if (pathname.startsWith("/admin")) {
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(ROUTES.DASHBOARD, req.url))
    }
  }

  // Dashboard routes — any authenticated non-vendor user
  // (further role checks happen at the page/service level)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    if (userRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(ROUTES.ADMIN, req.url))
    }
  }

  // Vendor routes — vendor users only
  // (actual vendor association check happens in vendor/layout.tsx)
  if (pathname.startsWith("/vendor")) {
    if (userRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(ROUTES.ADMIN, req.url))
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - Any file with an extension (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf|map)).*)",
  ],
}
