// __tests__/unit/auth-schemas.test.ts
import { describe, it, expect } from "vitest"
import { loginSchema, registerSchema, forgotPasswordSchema } from "@/types/auth"

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "Password123!",
    })
    expect(result.success).toBe(true)
  })

  it("lowercases and trims email", () => {
    const result = loginSchema.safeParse({
      email: "  USER@EXAMPLE.COM  ",
      password: "Password123!",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("user@example.com")
    }
  })

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "notanemail", password: "Password123!" })
    expect(result.success).toBe(false)
  })

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "short" })
    expect(result.success).toBe(false)
  })

  it("rejects empty fields", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false)
  })
})

describe("registerSchema", () => {
  const validData = {
    name: "Priya Sharma",
    email: "priya@example.com",
    password: "Secure@123",
    confirmPassword: "Secure@123",
  }

  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(validData).success).toBe(true)
  })

  it("rejects short name", () => {
    const result = registerSchema.safeParse({ ...validData, name: "A" })
    expect(result.success).toBe(false)
  })

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "secure@123",
      confirmPassword: "secure@123",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors.some((e) => e.message.includes("uppercase"))).toBe(true)
    }
  })

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "SecurePass!",
      confirmPassword: "SecurePass!",
    })
    expect(result.success).toBe(false)
  })

  it("rejects password without special character", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "SecurePass1",
      confirmPassword: "SecurePass1",
    })
    expect(result.success).toBe(false)
  })

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: "Different@123",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors.some((e) => e.message === "Passwords do not match")).toBe(true)
    }
  })
})

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true)
  })

  it("rejects invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false)
  })
})
