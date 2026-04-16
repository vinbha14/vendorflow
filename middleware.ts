// middleware.ts — NextAuth v4
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl

        // Public paths — always allow
        const isPublic =
          pathname === "/" ||
          pathname.startsWith("/auth/") ||
          pathname.startsWith("/api/auth/") ||
          pathname.startsWith("/legal/") ||
          pathname.startsWith("/portal/") ||
          pathname.startsWith("/api/webhooks/") ||
          pathname === "/pricing" ||
          pathname === "/features" ||
          pathname === "/about" ||
          pathname === "/contact" ||
          pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|map|webp)$/) !== null

        if (isPublic) return true

        // Protected — require token
        return !!token
      },
    },
    pages: {
      signIn: "/auth/sign-in",
      error: "/auth/error",
    },
  }
)

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
