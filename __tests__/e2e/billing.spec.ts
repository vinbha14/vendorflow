// __tests__/e2e/billing.spec.ts
import { test, expect, type Page } from "@playwright/test"

const COMPANY_ADMIN_EMAIL = "priya@techcorpindia.com"
const COMPANY_ADMIN_PASSWORD = "Demo@123456"

async function signInAsAdmin(page: Page) {
  await page.goto("/auth/sign-in")
  await page.fill('input[type="email"]', COMPANY_ADMIN_EMAIL)
  await page.fill('input[type="password"]', COMPANY_ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL("**/dashboard**", { timeout: 10000 })
}

test.describe("Billing page", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto("/dashboard/billing")
  })

  test("shows current plan", async ({ page }) => {
    await expect(page.getByText("Current Plan")).toBeVisible()
    await expect(page.getByText("Growth")).toBeVisible()
  })

  test("shows subscription status badge", async ({ page }) => {
    await expect(page.getByText(/Active|Trialing/i)).toBeVisible()
  })

  test("shows usage meter", async ({ page }) => {
    await expect(page.getByText("Usage")).toBeVisible()
    await expect(page.getByText("Active vendors")).toBeVisible()
  })

  test("shows included plan features", async ({ page }) => {
    await expect(page.getByText("AI CV summarization")).toBeVisible()
    await expect(page.getByText("Duplicate detection")).toBeVisible()
  })

  test("shows billing cycle info", async ({ page }) => {
    await expect(page.getByText(/monthly billing|annual billing/i)).toBeVisible()
  })

  test("has Manage subscription button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Manage subscription/i })).toBeVisible()
  })

  test("non-admin cannot access billing", async ({ page }) => {
    // Sign in as hiring manager
    await page.goto("/auth/sign-in")
    await page.fill('input[type="email"]', "arjun@techcorpindia.com")
    await page.fill('input[type="password"]', "Demo@123456")
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard**", { timeout: 10000 })

    await page.goto("/dashboard/billing")
    // Should be redirected away
    await expect(page).not.toHaveURL(/billing$/)
  })
})

test.describe("Dashboard analytics", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto("/dashboard/analytics")
  })

  test("shows hiring funnel", async ({ page }) => {
    await expect(page.getByText("Hiring funnel")).toBeVisible()
    await expect(page.getByText("Submitted")).toBeVisible()
    await expect(page.getByText("Shortlisted")).toBeVisible()
    await expect(page.getByText("Hired")).toBeVisible()
  })

  test("shows vendor performance leaderboard", async ({ page }) => {
    await expect(page.getByText("Vendor performance")).toBeVisible()
    await expect(page.getByText("#1")).toBeVisible()
  })

  test("shows KPI cards", async ({ page }) => {
    await expect(page.getByText("Total Submissions")).toBeVisible()
    await expect(page.getByText("Shortlist Rate")).toBeVisible()
    await expect(page.getByText("Hire Rate")).toBeVisible()
  })
})

test.describe("Settings pages", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test("company settings page renders form", async ({ page }) => {
    await page.goto("/dashboard/settings/company")
    await expect(page.getByText("Company Settings")).toBeVisible()
    await expect(page.getByText("Basic information")).toBeVisible()
    await expect(page.locator('input[id="name"]')).toBeVisible()
  })

  test("branding settings shows color picker", async ({ page }) => {
    await page.goto("/dashboard/settings/branding")
    await expect(page.getByText("Branding")).toBeVisible()
    await expect(page.getByText("Brand colors")).toBeVisible()
    await expect(page.getByText("Live preview")).toBeVisible()
  })

  test("team settings shows members list", async ({ page }) => {
    await page.goto("/dashboard/settings/team")
    await expect(page.getByText("Team")).toBeVisible()
    await expect(page.getByText("Priya Sharma")).toBeVisible()
    await expect(page.getByText("Arjun Mehta")).toBeVisible()
  })

  test("audit logs are accessible to admin", async ({ page }) => {
    await page.goto("/dashboard/audit-logs")
    await expect(page.getByText("Audit Logs")).toBeVisible()
    await expect(page.getByText("Time")).toBeVisible()
    await expect(page.getByText("Action")).toBeVisible()
  })
})
