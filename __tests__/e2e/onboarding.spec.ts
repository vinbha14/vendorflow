// __tests__/e2e/onboarding.spec.ts
import { test, expect, type Page } from "@playwright/test"

// Use a unique email each run to avoid conflicts
const TEST_EMAIL = `onboard-${Date.now()}@e2etest.com`
const TEST_PASSWORD = "TestPass@123"
const TEST_NAME = "E2E Test User"

test.describe("Company onboarding wizard", () => {
  test("sign up and reach step 1", async ({ page }) => {
    await page.goto("/auth/sign-up")
    await page.fill('input[id="name"]', TEST_NAME)
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[id="password"]', TEST_PASSWORD)
    await page.fill('input[id="confirmPassword"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')

    // Should land on onboarding
    await page.waitForURL("**/onboarding**", { timeout: 15000 })
    await expect(page.getByText("Tell us about your company")).toBeVisible()
  })

  test("step 1 — validates required company name", async ({ page }) => {
    // Sign in as a fresh user that has no company yet
    await page.goto("/onboarding/company-details")

    // Submit without filling name
    await page.click('button[type="submit"]')
    await expect(page.locator(".text-destructive").first()).toBeVisible()
  })

  test("step indicator shows current progress", async ({ page }) => {
    await page.goto("/onboarding/company-details")

    // Step 1 circle should be highlighted
    const stepIndicator = page.locator('[class*="rounded-full"]').nth(0)
    await expect(stepIndicator).toBeVisible()
  })

  test("step 2 — branding page renders color presets", async ({ page }) => {
    await page.goto("/onboarding/branding")
    await expect(page.getByText("Brand your workspace")).toBeVisible()
    await expect(page.getByText("Indigo")).toBeVisible()
    await expect(page.getByText("Live preview")).toBeVisible()
  })

  test("step 2 — color preset updates preview", async ({ page }) => {
    await page.goto("/onboarding/branding")
    await page.click('button[title="Blue"]')
    // The primary color input should update
    const primaryInput = page.locator('input[id="primaryColor"]')
    const value = await primaryInput.inputValue()
    expect(value.toLowerCase()).toBe("#2563eb")
  })

  test("step 3 — subdomain page renders availability checker", async ({ page }) => {
    await page.goto("/onboarding/subdomain")
    await expect(page.getByText("Choose your subdomain")).toBeVisible()
    await expect(page.locator('input[id="subdomain"]')).toBeVisible()
  })

  test("step 3 — subdomain is auto-lowercased", async ({ page }) => {
    await page.goto("/onboarding/subdomain")
    const input = page.locator('input[id="subdomain"]')
    await input.fill("MyCompany")
    const value = await input.inputValue()
    expect(value).toBe("mycompany")
  })

  test("step 4 — plan page shows 3 plans", async ({ page }) => {
    await page.goto("/onboarding/plan")
    await expect(page.getByText("Starter")).toBeVisible()
    await expect(page.getByText("Growth")).toBeVisible()
    await expect(page.getByText("Scale")).toBeVisible()
  })

  test("step 4 — annual toggle shows discount badge", async ({ page }) => {
    await page.goto("/onboarding/plan")
    // Toggle to annual
    await page.click('button[role="switch"], button[class*="toggle"]')
    await expect(page.getByText("Save 20%")).toBeVisible()
  })

  test("step 4 — selecting a plan highlights it", async ({ page }) => {
    await page.goto("/onboarding/plan")
    // Click Starter plan
    await page.click('button:has-text("Starter")')
    // Continue button should show selected plan
    await expect(page.getByText(/Continue with Starter/i)).toBeVisible()
  })

  test("step 5 — billing page shows trial info", async ({ page }) => {
    await page.goto("/onboarding/billing")
    await expect(page.getByText("Start your free trial")).toBeVisible()
    await expect(page.getByText(/14-day free trial/i)).toBeVisible()
    await expect(page.getByText("$0 today")).toBeVisible()
  })

  test("step 5 — billing page shows trust signals", async ({ page }) => {
    await page.goto("/onboarding/billing")
    await expect(page.getByText("Cancel anytime")).toBeVisible()
    await expect(page.getByText("Stripe")).toBeVisible()
  })
})

test.describe("Pricing page", () => {
  test("displays all pricing plans", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("Starter")).toBeVisible()
    await expect(page.getByText("Growth")).toBeVisible()
    await expect(page.getByText("Scale")).toBeVisible()
    await expect(page.getByText("Enterprise")).toBeVisible()
  })

  test("monthly/annual toggle works", async ({ page }) => {
    await page.goto("/pricing")
    // Check monthly price visible
    await expect(page.getByText("$49")).toBeVisible()
    // Toggle to annual
    await page.click('button[role="switch"], button[class*="toggle"]')
    // Annual price should now be visible for starter
    await expect(page.getByText("$39")).toBeVisible()
  })

  test("full comparison table is visible", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("Full feature comparison")).toBeVisible()
    await expect(page.getByText("AI CV summarization")).toBeVisible()
    await expect(page.getByText("Duplicate detection")).toBeVisible()
  })

  test("FAQ section is present", async ({ page }) => {
    await page.goto("/pricing")
    await expect(page.getByText("Frequently asked questions")).toBeVisible()
    await expect(page.getByText("How does pricing work?")).toBeVisible()
  })

  test("CTA links to sign up", async ({ page }) => {
    await page.goto("/pricing")
    const ctaButton = page.getByRole("link", { name: /Start free trial/i }).first()
    await expect(ctaButton).toHaveAttribute("href", /sign-up/)
  })
})
