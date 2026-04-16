// middleware.ts — minimal, no subdomain logic
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PREFIXES = [
  "/auth/",
  "/api/auth/",
  "/legal/",
  "/portal/",
  "/api/webhooks/",
  "/_next/",
  "/favicon",
]

const PUBLIC_EXACT = ["/", "/pricing", "/features", "/about", "/contact", "/demo"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static files
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|map|webp|gif)$/)) {
    return NextResponse.next()
  }

  // Public paths — always allow
  if (PUBLIC_EXACT.includes(pathname)) return NextResponse.next()
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()

  // Check JWT token
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = "/auth/sign-in"
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
