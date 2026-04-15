// services/auth.service.ts
"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema, type RegisterInput } from "@/types/auth"
import { AUDIT_ACTIONS } from "@/config/constants"
import { headers } from "next/headers"

export async function registerUser(input: RegisterInput): Promise<{
  success: boolean
  error?: string
  userId?: string
}> {
  try {
    const parsed = registerSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
    }

    const { name, email, password } = parsed.data

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existing) {
      return { success: false, error: "An account with this email already exists." }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        globalRole: "USER",
        isActive: true,
        emailVerified: new Date(), // Auto-verify for now
      },
    })

    // Best-effort audit log — don't fail registration if this fails
    try {
      await prisma.auditLog.create({
        data: {
          companyId: null,
          actorId: user.id,
          actorEmail: user.email,
          actorRole: "USER",
          action: AUDIT_ACTIONS.USER_REGISTERED,
          entity: "User",
          entityId: user.id,
          after: { email: user.email, name: user.name },
          ipAddress: await getClientIp(),
        },
      })
    } catch (auditErr) {
      console.error("[Auth] Audit log failed (non-fatal):", auditErr)
    }

    return { success: true, userId: user.id }
  } catch (err) {
    console.error("[Auth] registerUser error:", err)
    const message = err instanceof Error ? err.message : "Registration failed"
    // Return friendly message for common DB errors
    if (message.includes("password_hash") || message.includes("hashed_password") || message.includes("column")) {
      return { success: false, error: "Database schema mismatch — please contact support." }
    }
    if (message.includes("connect") || message.includes("authentication") || message.includes("ECONNREFUSED")) {
      return { success: false, error: "Database connection failed — please try again shortly." }
    }
    return { success: false, error: "Registration failed. Please try again." }
  }
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    })
    return !existing
  } catch {
    return true
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true },
    })

    if (user) {
      const token = crypto.randomUUID()
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await prisma.verificationToken.upsert({
        where: { identifier_token: { identifier: user.email, token: "password-reset" } },
        update: { token, expires },
        create: { identifier: user.email, token, expires },
      })

      console.log(`[Auth] Password reset token for ${user.email}: ${token}`)
    }
  } catch (err) {
    console.error("[Auth] requestPasswordReset error:", err)
  }

  return { success: true }
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { token, expires: { gt: new Date() } },
    })

    if (!verificationToken) {
      return { success: false, error: "This reset link is invalid or has expired." }
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
      select: { id: true, email: true },
    })

    if (!user) {
      return { success: false, error: "User not found." }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    })

    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: verificationToken.identifier, token } },
    })

    try {
      await prisma.auditLog.create({
        data: {
          companyId: null,
          actorId: user.id,
          actorEmail: user.email,
          actorRole: "USER",
          action: AUDIT_ACTIONS.USER_PASSWORD_CHANGED,
          entity: "User",
          entityId: user.id,
          ipAddress: await getClientIp(),
        },
      })
    } catch (auditErr) {
      console.error("[Auth] Audit log failed (non-fatal):", auditErr)
    }

    return { success: true }
  } catch (err) {
    console.error("[Auth] resetPassword error:", err)
    return { success: false, error: "Password reset failed. Please try again." }
  }
}

async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers()
    return (
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown"
    )
  } catch {
    return "unknown"
  }
}
