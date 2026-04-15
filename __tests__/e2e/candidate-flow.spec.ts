// __tests__/e2e/candidate-flow.spec.ts
// Tests the full candidate lifecycle end-to-end.

import { test, expect, type Page } from "@playwright/test"

const VENDOR_EMAIL = "neha@talentbridge.in"
const VENDOR_PASSWORD = "Vendor@123456"
const HIRING_MANAGER_EMAIL = "arjun@techcorpindia.com"
const HIRING_MANAGER_PASSWORD = "Demo@123456"

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth/sign-in")
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForLoadState("networkidle")
}

test.describe("Candidate submission form", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, VENDOR_EMAIL, VENDOR_PASSWORD)
    await page.waitForURL("**/vendor**", { timeout: 10000 })
  })

  test("vendor can navigate to submit candidate", async ({ page }) => {
    await page.goto("/vendor/candidates/new")
    await expect(page.getByText("Submit a Candidate")).toBeVisible()
  })

  test("form shows all required sections", async ({ page }) => {
    await page.goto("/vendor/candidates/new")
    await expect(page.getByText("Submit to company")).toBeVisible()
    await expect(page.getByText("CV / Resume")).toBeVisible()
    await expect(page.getByText("Personal Information")).toBeVisible()
    await expect(page.getByText("Professional Details")).toBeVisible()
    await expect(page.getByText("Availability & Compensation")).toBeVisible()
    await expect(page.getByText("Education")).toBeVisible()
  })

  test("shows validation error for empty required fields", async ({ page }) => {
    await page.goto("/vendor/candidates/new")
    await page.click('button[type="submit"]')
    // Should show validation errors
    await expect(page.locator(".text-destructive").first()).toBeVisible()
  })

  test("skill tag system works correctly", async ({ page }) => {
    await page.goto("/vendor/candidates/new")

    // Type a skill and press Enter
    const skillInput = page.locator('input[placeholder="Type a skill and press Enter or +"]')
    await skillInput.fill("React")
    await skillInput.press("Enter")

    // Skill tag should appear
    await expect(page.getByText("React").first()).toBeVisible()
  })

  test("clicking suggestion skill adds it", async ({ page }) => {
    await page.goto("/vendor/candidates/new")

    // Click a suggestion chip
    await page.click('button:has-text("+ TypeScript")')

    // Should appear as a tag
    await expect(page.locator('[class*="rounded-full"][class*="primary"]').getByText("TypeScript")).toBeVisible()
  })
})

test.describe("Vendor candidate list", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, VENDOR_EMAIL, VENDOR_PASSWORD)
    await page.waitForURL("**/vendor**", { timeout: 10000 })
  })

  test("displays submitted candidates", async ({ page }) => {
    await page.goto("/vendor/candidates")
    await expect(page.getByText("My Candidates")).toBeVisible()
    // Should show the seeded candidate
    await expect(page.getByText("Amit Kapoor").first()).toBeVisible()
  })

  test("status filter tabs work", async ({ page }) => {
    await page.goto("/vendor/candidates")

    // Click Shortlisted tab
    await page.click('[href*="status=SHORTLISTED"]')
    await expect(page).toHaveURL(/status=SHORTLISTED/)
  })
})

test.describe("Hiring manager candidate review", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, HIRING_MANAGER_EMAIL, HIRING_MANAGER_PASSWORD)
    await page.waitForURL("**/dashboard**", { timeout: 10000 })
  })

  test("candidates page shows submissions", async ({ page }) => {
    await page.goto("/dashboard/candidates")
    await expect(page.getByText("Candidates")).toBeVisible()
  })

  test("status tab filters work", async ({ page }) => {
    await page.goto("/dashboard/candidates")

    // Click "Shortlisted" tab
    await page.click('a[href*="status=SHORTLISTED"]')
    await page.waitForLoadState("networkidle")
    expect(page.url()).toContain("status=SHORTLISTED")
  })

  test("clicking a candidate opens detail page", async ({ page }) => {
    await page.goto("/dashboard/candidates")

    // Click first candidate
    const firstCandidate = page.locator('a[href*="/dashboard/candidates/"]').first()
    if (await firstCandidate.count() > 0) {
      await firstCandidate.click()
      await expect(page).toHaveURL(/\/dashboard\/candidates\/.+/)
      await expect(page.getByText("AI Summary")).toBeVisible()
    }
  })

  test("AI summary card shows on candidate detail", async ({ page }) => {
    await page.goto("/dashboard/candidates")

    const firstCandidate = page.locator('a[href*="/dashboard/candidates/"]').first()
    if (await firstCandidate.count() > 0) {
      await firstCandidate.click()
      // AI summary card should be present (may be loading)
      await expect(page.getByText("AI Summary")).toBeVisible()
    }
  })

  test("duplicate alerts are shown on duplicates page", async ({ page }) => {
    await page.goto("/dashboard/duplicates")
    await expect(page.getByText("Duplicate Detection")).toBeVisible()
    // Should show the seeded duplicate alert
    await expect(page.getByText(/Amit Kapoor|duplicate/i).first()).toBeVisible()
  })
})
