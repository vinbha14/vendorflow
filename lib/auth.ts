// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserGlobalRole } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";
import { loginSchema } from "@/types/auth";

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("[Auth] authorize called with email:", credentials?.email)

          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) {
            console.log("[Auth] validation failed:", parsed.error.errors)
            return null;
          }

          const { email, password } = parsed.data;

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              hashedPassword: true,
              globalRole: true,
              isActive: true,
            },
          });

          console.log("[Auth] user found:", !!user, "isActive:", user?.isActive, "hasPassword:", !!user?.hashedPassword)

          if (!user || !user.isActive) return null;
          if (!user.hashedPassword) return null;

          const passwordValid = await bcrypt.compare(password, user.hashedPassword);
          console.log("[Auth] password valid:", passwordValid)

          if (!passwordValid) return null;

          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }).catch(console.error);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            globalRole: user.globalRole,
          };
        } catch (err) {
          console.error("[Auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token["id"] = user.id;
        token["email"] = user.email;
        token["name"] = user.name;
        token["globalRole"] = (user as { globalRole?: UserGlobalRole }).globalRole ?? UserGlobalRole.USER;
      }
      if (trigger === "update" && session) {
        token["globalRole"] = session.globalRole ?? token["globalRole"];
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token["id"] as string;
        session.user.email = token["email"] as string;
        session.user.name = token["name"] as string;
        session.user.globalRole = token["globalRole"] as UserGlobalRole;
      }
      return session;
    },
    async signIn({ user }) {
      console.log("[Auth] signIn callback, user:", user?.email)
      if (!user.email) return false;
      return true;
    },
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAuth();
  if (session.user.globalRole !== UserGlobalRole.SUPER_ADMIN) throw new Error("FORBIDDEN");
  return session;
}

export async function getCurrentUserWithMembership(companyId: string) {
  const session = await requireAuth();
  if (session.user.globalRole === UserGlobalRole.SUPER_ADMIN) {
    return { user: session.user, membership: null, isSuperAdmin: true, role: "SUPER_ADMIN" as const };
  }
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
    include: { user: { select: { id: true, email: true, name: true, image: true, globalRole: true } } },
  });
  if (!membership || !membership.isActive) throw new Error("FORBIDDEN");
  return { user: session.user, membership, isSuperAdmin: false, role: membership.role };
}

export async function getCurrentUserVendorContext() {
  const session = await requireAuth();
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
  });
  if (!vendorUser) throw new Error("FORBIDDEN: Not a vendor user");
  return {
    user: session.user,
    vendorUser,
    vendor: vendorUser.vendor,
    vendorRole: vendorUser.role as "ADMIN" | "RECRUITER",
    assignedCompanies: vendorUser.vendor.companyRelationships.map((vc) => ({
      ...vc.company,
      vendorRelationship: vc,
    })),
  };
}
