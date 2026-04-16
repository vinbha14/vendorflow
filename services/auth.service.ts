// services/auth.service.ts
"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema, type RegisterInput } from "@/types/auth"
import { AUDIT_ACTIONS } from "@/config/constants"

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
    const normalizedEmail = email.toLowerCase().trim()

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (existing) {
      return { success: false, error: "An account with this email already exists." }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        hashedPassword,
        globalRole: "USER",
        isActive: true,
        emailVerified: new Date(),
      },
    })

    // Non-fatal audit log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          actorRole: "USER",
          action: AUDIT_ACTIONS.USER_REGISTERED,
          entity: "User",
          entityId: user.id,
        },
      })
    } catch { /* non-fatal */ }

    return { success: true, userId: user.id }
  } catch (err) {
    console.error("[Auth] registerUser error:", err)
    const msg = err instanceof Error ? err.message : ""
    if (msg.includes("connect") || msg.includes("ECONNREFUSED")) {
      return { success: false, error: "Database connection failed. Please try again." }
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
      select: { id: true, email: true },
    })
    if (user) {
      const token = crypto.randomUUID()
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await prisma.verificationToken.upsert({
        where: { identifier_token: { identifier: user.email, token: "password-reset" } },
        update: { token, expires },
        create: { identifier: user.email, token, expires },
      })
      console.log(`[Auth] Reset token for ${user.email}: ${token}`)
    }
  } catch (err) {
    console.error("[Auth] requestPasswordReset error:", err)
  }
  return { success: true }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const vt = await prisma.verificationToken.findFirst({
      where: { token, expires: { gt: new Date() } },
    })
    if (!vt) return { success: false, error: "Reset link is invalid or expired." }

    const user = await prisma.user.findUnique({
      where: { email: vt.identifier },
      select: { id: true, email: true },
    })
    if (!user) return { success: false, error: "User not found." }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { hashedPassword } })
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: vt.identifier, token } },
    })

    return { success: true }
  } catch (err) {
    console.error("[Auth] resetPassword error:", err)
    return { success: false, error: "Password reset failed." }
  }
}
