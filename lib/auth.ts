// lib/auth.ts — NextAuth v4
import { NextAuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              hashedPassword: true,
              globalRole: true,
              isActive: true,
            },
          })

          if (!user || !user.isActive || !user.hashedPassword) return null

          const valid = await bcrypt.compare(credentials.password, user.hashedPassword)
          if (!valid) return null

          // Update last login non-blocking
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }).catch(() => {})

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? "",
            image: user.image ?? "",
            globalRole: user.globalRole,
          }
        } catch (err) {
          console.error("[Auth] authorize error:", err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.globalRole = (user as any).globalRole ?? "USER"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.globalRole = token.globalRole as any
      }
      return session
    },
  },
}

// Helper to get session in server components / server actions
export async function auth() {
  return getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) throw new Error("UNAUTHORIZED")
  return session
}

export async function requireSuperAdmin() {
  const session = await requireAuth()
  if (session.user.globalRole !== "SUPER_ADMIN") throw new Error("FORBIDDEN")
  return session
}

export async function getCurrentUserWithMembership(companyId: string) {
  const session = await requireAuth()
  if (session.user.globalRole === "SUPER_ADMIN") {
    return { user: session.user, membership: null, isSuperAdmin: true, role: "SUPER_ADMIN" as const }
  }
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
    include: { user: { select: { id: true, email: true, name: true, image: true, globalRole: true } } },
  })
  if (!membership?.isActive) throw new Error("FORBIDDEN")
  return { user: session.user, membership, isSuperAdmin: false, role: membership.role }
}

export async function getCurrentUserVendorContext() {
  const session = await requireAuth()
  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: {
      vendor: {
        include: {
          companyRelationships: {
            where: { status: "APPROVED" },
            include: { company: { include: { branding: true } } },
          },
        },
      },
    },
  })
  if (!vendorUser) throw new Error("FORBIDDEN")
  return {
    user: session.user,
    vendorUser,
    vendor: vendorUser.vendor,
    vendorRole: vendorUser.role as "ADMIN" | "RECRUITER",
    assignedCompanies: vendorUser.vendor.companyRelationships.map((vc) => ({
      ...vc.company,
      vendorRelationship: vc,
    })),
  }
}
