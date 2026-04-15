// __tests__/integration/auth-service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { makeUser } from "../helpers/factories"

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects registration with existing email", async () => {
    const existingUser = makeUser({ email: "existing@example.com" })
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser)

    const { registerUser } = await import("@/services/auth.service")
    const result = await registerUser({
      name: "Test User",
      email: "existing@example.com",
      password: "Secure@123",
      confirmPassword: "Secure@123",
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("already exists")
  })

  it("rejects invalid email format", async () => {
    const { registerUser } = await import("@/services/auth.service")
    const result = await registerUser({
      name: "Test User",
      email: "not-an-email",
      password: "Secure@123",
      confirmPassword: "Secure@123",
    })

    expect(result.success).toBe(false)
  })

  it("rejects weak password", async () => {
    const { registerUser } = await import("@/services/auth.service")
    const result = await registerUser({
      name: "Test User",
      email: "newuser@example.com",
      password: "weak",
      confirmPassword: "weak",
    })

    expect(result.success).toBe(false)
  })

  it("rejects mismatched passwords", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const { registerUser } = await import("@/services/auth.service")
    const result = await registerUser({
      name: "Test User",
      email: "newuser@example.com",
      password: "Secure@123",
      confirmPassword: "Different@123",
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("match")
  })

  it("succeeds with valid data and no existing user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(
      makeUser({ email: "newuser@example.com", name: "Test User" })
    )
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    const { registerUser } = await import("@/services/auth.service")
    const result = await registerUser({
      name: "Test User",
      email: "newuser@example.com",
      password: "Secure@123",
      confirmPassword: "Secure@123",
    })

    expect(result.success).toBe(true)
    expect(result.userId).toBeDefined()
    expect(prisma.user.create).toHaveBeenCalledOnce()
  })
})

describe("requestPasswordReset", () => {
  it("always returns success (prevents email enumeration)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null) // User doesn't exist

    const { requestPasswordReset } = await import("@/services/auth.service")
    const result = await requestPasswordReset("unknown@example.com")

    // Must return success even for non-existent email
    expect(result.success).toBe(true)
  })

  it("creates verification token for existing user", async () => {
    const user = makeUser({ email: "existing@example.com" })
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user)
    vi.mocked(prisma.verificationToken.upsert).mockResolvedValue({} as any)

    const { requestPasswordReset } = await import("@/services/auth.service")
    const result = await requestPasswordReset("existing@example.com")

    expect(result.success).toBe(true)
    expect(prisma.verificationToken.upsert).toHaveBeenCalledOnce()
  })
})

describe("checkEmailAvailability", () => {
  it("returns true when email is not taken", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const { checkEmailAvailability } = await import("@/services/auth.service")
    const available = await checkEmailAvailability("new@example.com")

    expect(available).toBe(true)
  })

  it("returns false when email is already taken", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(makeUser())

    const { checkEmailAvailability } = await import("@/services/auth.service")
    const available = await checkEmailAvailability("taken@example.com")

    expect(available).toBe(false)
  })
})
