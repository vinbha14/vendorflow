// __tests__/e2e/vendor-management.spec.ts
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

test.describe("Vendor list", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test("shows the vendors page with seeded vendors", async ({ page }) => {
    await page.goto("/dashboard/vendors")
    await expect(page.getByText("Vendors")).toBeVisible()
    await expect(page.getByText("TalentBridge India")).toBeVisible()
    await expect(page.getByText("CodeForce Staffing")).toBeVisible()
  })

  test("status tabs filter vendors correctly", async ({ page }) => {
    await page.goto("/dashboard/vendors")

    // Click the "Pending" tab
    await page.click('a[href*="status=PENDING"]')
    await page.waitForLoadState("networkidle")
    // Global Tech Recruit is pending
    await expect(page.getByText("Global Tech Recruit")).toBeVisible()
  })

  test("invite vendor button navigates to invite form", async ({ page }) => {
    await page.goto("/dashboard/vendors")
    await page.click('a[href*="invite"]')
    await expect(page).toHaveURL(/vendors\/invite/)
    await expect(page.getByText("Invite a Vendor")).toBeVisible()
  })
})

test.describe("Vendor invitation form", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
    await page.goto("/dashboard/vendors/invite")
  })

  test("renders all required fields", async ({ page }) => {
    await expect(page.locator('input[id="vendorName"]')).toBeVisible()
    await expect(page.locator('input[id="email"]')).toBeVisible()
    await expect(page.locator('textarea[id="message"]')).toBeVisible()
  })

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.click('button[type="submit"]')
    await expect(page.locator(".text-destructive").first()).toBeVisible({ timeout: 3000 })
  })

  test("shows error for invalid email", async ({ page }) => {
    await page.fill('input[id="vendorName"]', "Test Vendor")
    await page.fill('input[id="email"]', "not-an-email")
    await page.click('button[type="submit"]')
    await expect(page.getByText(/valid email/i)).toBeVisible()
  })

  test("pre-fills message field with default text", async ({ page }) => {
    const textarea = page.locator('textarea[id="message"]')
    const value = await textarea.inputValue()
    expect(value.length).toBeGreaterThan(10)
  })

  test("back button navigates to vendors list", async ({ page }) => {
    await page.click('button:has-text("Back")')
    await expect(page).toHaveURL(/vendors$/)
  })
})

test.describe("Company branded portal", () => {
  test("public portal is accessible without auth", async ({ page }) => {
    await page.goto("/portal/techcorp-india")
    await expect(page.getByText("TechCorp India")).toBeVisible()
    await expect(page.getByText("Vendor Portal")).toBeVisible()
  })

  test("portal shows open opportunities from branding", async ({ page }) => {
    await page.goto("/portal/techcorp-india")
    await expect(page.getByText("Open opportunities")).toBeVisible()
    // Seeded opportunities
    await expect(page.getByText("Senior React Developer")).toBeVisible()
  })

  test("portal shows submit candidates CTA", async ({ page }) => {
    await page.goto("/portal/techcorp-india")
    await expect(page.getByRole("link", { name: /Submit candidates/i })).toBeVisible()
  })

  test("non-existent portal slug shows 404", async ({ page }) => {
    await page.goto("/portal/this-company-does-not-exist-xyz")
    // Should return 404
    await expect(page.getByText(/not found/i)).toBeVisible()
  })
})

test.describe("Vendor detail page", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test("vendor detail shows profile and stats", async ({ page }) => {
    await page.goto("/dashboard/vendors")
    // Click TalentBridge India
    await page.click('text=TalentBridge India')
    await page.waitForURL(/vendors\/.+/)

    await expect(page.getByText("contact@talentbridge.in")).toBeVisible()
    await expect(page.getByText("Submitted")).toBeVisible()
    await expect(page.getByText("Accepted")).toBeVisible()
  })
})
