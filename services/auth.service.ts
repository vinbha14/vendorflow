// services/auth.service.ts
// All auth-related server actions: registration, email verification, password reset.
// These are called from client components via "use server" actions.

"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema, type RegisterInput } from "@/types/auth"
import { AUDIT_ACTIONS } from "@/config/constants"
import { headers } from "next/headers"

// ─────────────────────────────────────────────────────────────────────────────
// Register a new user
// ─────────────────────────────────────────────────────────────────────────────
export async function registerUser(input: RegisterInput): Promise<{
  success: boolean
  error?: string
  userId?: string
}> {
  // Validate
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { name, email, password } = parsed.data

  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existing) {
    return { success: false, error: "An account with this email already exists." }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      globalRole: "USER",
      isActive: true,
      // Don't set emailVerified — require email confirmation
    },
  })

  // Write audit log
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

  // In production: send verification email here
  // await sendVerificationEmail(user.email, verificationToken)
  // For now we auto-verify in dev
  if (process.env["NODE_ENV"] === "development") {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })
  }

  return { success: true, userId: user.id }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check if email is available
// ─────────────────────────────────────────────────────────────────────────────
export async function checkEmailAvailability(email: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true },
  })
  return !existing
}

// ─────────────────────────────────────────────────────────────────────────────
// Request password reset
// ─────────────────────────────────────────────────────────────────────────────
export async function requestPasswordReset(email: string): Promise<{ success: boolean }> {
  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, name: true },
  })

  if (user) {
    // Generate a secure token
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store as a verification token
    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier: user.email, token: "password-reset" } },
      update: { token, expires },
      create: { identifier: user.email, token, expires },
    })

    // TODO: Send email via Resend
    // await sendPasswordResetEmail(user.email, user.name, token)
    console.log(`[Auth] Password reset token for ${user.email}: ${token}`)
  }

  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset password with token
// ─────────────────────────────────────────────────────────────────────────────
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // Find the token
  const verificationToken = await prisma.verificationToken.findFirst({
    where: { token, expires: { gt: new Date() } },
  })

  if (!verificationToken) {
    return { success: false, error: "This reset link is invalid or has expired." }
  }

  // Find user by identifier (email)
  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
    select: { id: true, email: true },
  })

  if (!user) {
    return { success: false, error: "User not found." }
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12)

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword },
  })

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: verificationToken.identifier, token } },
  })

  // Audit log
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

  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  )
}
