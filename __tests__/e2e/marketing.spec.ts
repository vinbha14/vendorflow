// __tests__/e2e/marketing.spec.ts
import { test, expect } from "@playwright/test"

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("renders the hero section", async ({ page }) => {
    await expect(page.getByText("Vendor management")).toBeVisible()
    await expect(page.getByText("reimagined for AI")).toBeVisible()
  })

  test("has sign-in and sign-up buttons in nav", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible()
    await expect(page.getByRole("link", { name: /Get started free/i })).toBeVisible()
  })

  test("features section is present", async ({ page }) => {
    await expect(page.getByText("Everything your team needs")).toBeVisible()
    await expect(page.getByText("Branded company portals")).toBeVisible()
    await expect(page.getByText("AI CV summarization")).toBeVisible()
    await expect(page.getByText("Intelligent duplicate detection")).toBeVisible()
  })

  test("AI section highlights key capabilities", async ({ page }) => {
    await expect(page.getByText("Every CV, summarized in seconds")).toBeVisible()
    await expect(page.getByText(/Executive Summary|5-section/i)).toBeVisible()
  })

  test("social proof section shows testimonials", async ({ page }) => {
    await expect(page.getByText("TechCorp India")).toBeVisible()
    await expect(page.getByText("GlobalHire Corp")).toBeVisible()
  })

  test("stats are displayed", async ({ page }) => {
    await expect(page.getByText("500+")).toBeVisible()
    await expect(page.getByText("12,000+")).toBeVisible()
  })

  test("pricing preview is on homepage", async ({ page }) => {
    await expect(page.getByText("Simple pricing")).toBeVisible()
    await expect(page.getByText("$49")).toBeVisible()
    await expect(page.getByText("$149")).toBeVisible()
  })

  test("footer has legal links", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Privacy Policy" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Terms of Service" })).toBeVisible()
  })

  test("CTA section has get started button", async ({ page }) => {
    await expect(page.getByText("Ready to modernize your vendor management?")).toBeVisible()
    await expect(page.getByRole("link", { name: /Start free trial/i }).last()).toBeVisible()
  })

  test("page has correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/VendorFlow/)
  })
})

test.describe("Navigation", () => {
  test("features link navigates to features section", async ({ page }) => {
    await page.goto("/")
    await page.click('nav a[href="/features"]')
    await expect(page).toHaveURL(/features/)
  })

  test("pricing link navigates to pricing page", async ({ page }) => {
    await page.goto("/")
    await page.click('nav a[href="/pricing"]')
    await expect(page).toHaveURL(/pricing/)
    await expect(page.getByText("Pay for vendors, not seats")).toBeVisible()
  })
})

test.describe("Responsive layout", () => {
  test("mobile hero section is readable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/")
    await expect(page.getByText("Vendor management")).toBeVisible()
    // Sign up button should be visible on mobile
    await expect(page.getByRole("link", { name: /Get started free/i }).first()).toBeVisible()
  })
})
