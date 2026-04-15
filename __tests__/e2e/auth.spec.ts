// __tests__/e2e/auth.spec.ts
// End-to-end authentication tests using Playwright.
// These run against a live dev server with seed data.
// Run with: npm run test:e2e

import { test, expect, type Page } from "@playwright/test"

// ─── Constants ────────────────────────────────────────────────────────────────
const COMPANY_ADMIN_EMAIL = "priya@techcorpindia.com"
const COMPANY_ADMIN_PASSWORD = "Demo@123456"
const VENDOR_EMAIL = "ravi@talentbridge.in"
const VENDOR_PASSWORD = "Vendor@123456"
const SUPER_ADMIN_EMAIL = "admin@vendorflow.com"
const SUPER_ADMIN_PASSWORD = "Admin@123456"

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth/sign-in")
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}

async function signOut(page: Page) {
  // Click the logout button in the sidebar
  await page.click('[title="Sign out"]')
  await page.waitForURL("**/auth/sign-in")
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Sign in page", () => {
  test("renders the sign-in form", async ({ page }) => {
    await page.goto("/auth/sign-in")
    await expect(page.getByText("Welcome back")).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/auth/sign-in")
    await page.fill('input[type="email"]', "wrong@example.com")
    await page.fill('input[type="password"]', "WrongPassword123!")
    await page.click('button[type="submit"]')

    await expect(page.getByText(/Invalid email or password/i)).toBeVisible({ timeout: 5000 })
  })

  test("shows validation error for empty email", async ({ page }) => {
    await page.goto("/auth/sign-in")
    await page.fill('input[type="password"]', "password123")
    await page.click('button[type="submit"]')
    // HTML5 or zod validation
    await expect(page.locator('input[type="email"]')).toBeFocused()
  })

  test("has link to sign up page", async ({ page }) => {
    await page.goto("/auth/sign-in")
    const signUpLink = page.getByRole("link", { name: /Create one free/i })
    await expect(signUpLink).toBeVisible()
    await signUpLink.click()
    await expect(page).toHaveURL(/auth\/sign-up/)
  })

  test("has link to forgot password", async ({ page }) => {
    await page.goto("/auth/sign-in")
    await expect(page.getByRole("link", { name: /Forgot password/i })).toBeVisible()
  })
})

test.describe("Sign up page", () => {
  test("renders the registration form", async ({ page }) => {
    await page.goto("/auth/sign-up")
    await expect(page.getByText("Create your account")).toBeVisible()
    await expect(page.locator('input[id="name"]')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[id="password"]')).toBeVisible()
  })

  test("shows password strength indicator", async ({ page }) => {
    await page.goto("/auth/sign-up")
    await page.fill('input[id="password"]', "abc")

    // Should show the password rules
    await expect(page.getByText("At least 8 characters")).toBeVisible()
    await expect(page.getByText("One uppercase letter")).toBeVisible()
  })

  test("shows error when passwords don't match", async ({ page }) => {
    await page.goto("/auth/sign-up")
    await page.fill('input[id="name"]', "Test User")
    await page.fill('input[type="email"]', "newuser@example.com")
    await page.fill('input[id="password"]', "Secure@123")
    await page.fill('input[id="confirmPassword"]', "Different@123")
    await page.click('button[type="submit"]')

    await expect(page.getByText(/Passwords do not match/i)).toBeVisible()
  })
})

test.describe("Company admin authentication", () => {
  test("signs in and reaches dashboard", async ({ page }) => {
    await signIn(page, COMPANY_ADMIN_EMAIL, COMPANY_ADMIN_PASSWORD)
    await page.waitForURL("**/dashboard**", { timeout: 10000 })
    await expect(page.getByText("Dashboard")).toBeVisible()
  })

  test("redirected to sign-in when accessing dashboard without auth", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForURL("**/auth/sign-in**")
    await expect(page.getByText("Welcome back")).toBeVisible()
  })

  test("signs out and redirects to sign-in", async ({ page }) => {
    await signIn(page, COMPANY_ADMIN_EMAIL, COMPANY_ADMIN_PASSWORD)
    await page.waitForURL("**/dashboard**", { timeout: 10000 })
    await signOut(page)
    await expect(page).toHaveURL(/auth\/sign-in/)
  })
})

test.describe("Role-based access control", () => {
  test("company admin cannot access /admin", async ({ page }) => {
    await signIn(page, COMPANY_ADMIN_EMAIL, COMPANY_ADMIN_PASSWORD)
    await page.waitForURL("**/dashboard**", { timeout: 10000 })
    await page.goto("/admin")
    // Should be redirected to dashboard, not admin
    await expect(page).not.toHaveURL(/\/admin$/)
  })

  test("super admin reaches /admin dashboard", async ({ page }) => {
    await signIn(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
    await page.waitForURL("**/admin**", { timeout: 10000 })
    await expect(page.getByText("Platform Overview")).toBeVisible()
  })

  test("vendor user reaches /vendor dashboard", async ({ page }) => {
    await signIn(page, VENDOR_EMAIL, VENDOR_PASSWORD)
    await page.waitForURL("**/vendor**", { timeout: 10000 })
    await expect(page.getByText("Vendor Dashboard")).toBeVisible()
  })

  test("vendor cannot access /dashboard", async ({ page }) => {
    await signIn(page, VENDOR_EMAIL, VENDOR_PASSWORD)
    await page.waitForURL("**/vendor**", { timeout: 10000 })
    await page.goto("/dashboard")
    // Should stay on vendor routes or be redirected, never show company dashboard
    await expect(page).not.toHaveURL(/\/dashboard$/)
  })
})
