// services/auth.service.ts
"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function registerUser(input: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const { name, email, password, confirmPassword } = input

    if (!name || name.length < 2) return { success: false, error: "Name must be at least 2 characters." }
    if (!email || !email.includes("@")) return { success: false, error: "Please enter a valid email." }
    if (password.length < 8) return { success: false, error: "Password must be at least 8 characters." }
    if (password !== confirmPassword) return { success: false, error: "Passwords do not match." }
    if (!/[A-Z]/.test(password)) return { success: false, error: "Password must contain an uppercase letter." }
    if (!/[0-9]/.test(password)) return { success: false, error: "Password must contain a number." }
    if (!/[^A-Za-z0-9]/.test(password)) return { success: false, error: "Password must contain a special character." }

    const normalizedEmail = email.toLowerCase().trim()

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })
    if (existing) return { success: false, error: "An account with this email already exists." }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        hashedPassword,
        globalRole: "USER",
        isActive: true,
        emailVerified: new Date(),
      },
    })

    return { success: true, userId: user.id }
  } catch (err) {
    console.error("[registerUser] error:", err)
    const msg = err instanceof Error ? err.message : ""
    if (msg.includes("connect") || msg.includes("ECONNREFUSED")) {
      return { success: false, error: "Database unavailable. Please try again." }
    }
    return { success: false, error: "Registration failed. Please try again." }
  }
}
