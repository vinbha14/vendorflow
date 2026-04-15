// __tests__/e2e/admin.spec.ts
import { test, expect, type Page } from "@playwright/test"

const SUPER_ADMIN_EMAIL = "admin@vendorflow.com"
const SUPER_ADMIN_PASSWORD = "Admin@123456"

async function signInAsSuperAdmin(page: Page) {
  await page.goto("/auth/sign-in")
  await page.fill('input[type="email"]', SUPER_ADMIN_EMAIL)
  await page.fill('input[type="password"]', SUPER_ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL("**/admin**", { timeout: 10000 })
}

test.describe("Super admin access control", () => {
  test("super admin reaches /admin directly after sign-in", async ({ page }) => {
    await signInAsSuperAdmin(page)
    await expect(page.getByText("Platform Overview")).toBeVisible()
  })

  test("admin page shows security warning banner", async ({ page }) => {
    await signInAsSuperAdmin(page)
    await expect(page.getByText(/actions are audited/i)).toBeVisible()
  })

  test("admin sidebar has ADMIN badge", async ({ page }) => {
    await signInAsSuperAdmin(page)
    await expect(page.getByText("ADMIN")).toBeVisible()
  })

  test("non-admin cannot access /admin", async ({ page }) => {
    // Sign in as company admin
    await page.goto("/auth/sign-in")
    await page.fill('input[type="email"]', "priya@techcorpindia.com")
    await page.fill('input[type="password"]', "Demo@123456")
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard**", { timeout: 10000 })

    // Try to access admin
    await page.goto("/admin")
    // Should be redirected away
    await expect(page).not.toHaveURL(/\/admin$/)
  })
})

test.describe("Platform overview dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page)
  })

  test("shows KPI cards with platform metrics", async ({ page }) => {
    await expect(page.getByText("Total Companies")).toBeVisible()
    await expect(page.getByText("Total Vendors")).toBeVisible()
    await expect(page.getByText("Active Subscriptions")).toBeVisible()
    await expect(page.getByText("AI Summaries")).toBeVisible()
  })

  test("shows recent companies table", async ({ page }) => {
    await expect(page.getByText("Recent companies")).toBeVisible()
    await expect(page.getByText("TechCorp India")).toBeVisible()
    await expect(page.getByText("GlobalHire Corp")).toBeVisible()
  })

  test("shows recent audit events", async ({ page }) => {
    await expect(page.getByText("Recent audit events")).toBeVisible()
  })

  test("shows subscription health stats", async ({ page }) => {
    await expect(page.getByText("Subscription health")).toBeVisible()
    await expect(page.getByText("Active")).toBeVisible()
    await expect(page.getByText("Trialing")).toBeVisible()
  })
})

test.describe("Companies list", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page)
    await page.goto("/admin/companies")
  })

  test("shows all companies", async ({ page }) => {
    await expect(page.getByText("All Companies")).toBeVisible()
    await expect(page.getByText("TechCorp India")).toBeVisible()
    await expect(page.getByText("GlobalHire Corp")).toBeVisible()
  })

  test("search filters companies", async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', "techcorp")
    await page.click('button[type="submit"]')
    await page.waitForLoadState("networkidle")
    await expect(page.getByText("TechCorp India")).toBeVisible()
    // GlobalHire should not be visible
    await expect(page.getByText("GlobalHire Corp")).not.toBeVisible()
  })

  test("clicking company opens detail page", async ({ page }) => {
    await page.click('text=TechCorp India')
    await page.waitForURL(/admin\/companies\/.+/)
    await expect(page.getByText("Company profile")).toBeVisible()
  })
})

test.describe("Company detail page", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page)
    await page.goto("/admin/companies")
    await page.click('text=TechCorp India')
    await page.waitForURL(/admin\/companies\/.+/)
  })

  test("shows company profile details", async ({ page }) => {
    await expect(page.getByText("Company profile")).toBeVisible()
    await expect(page.getByText("Karnataka")).toBeVisible()
  })

  test("shows subscription information", async ({ page }) => {
    await expect(page.getByText("Subscription")).toBeVisible()
    await expect(page.getByText("Growth")).toBeVisible()
  })

  test("shows vendor relationships", async ({ page }) => {
    await expect(page.getByText("Vendors")).toBeVisible()
    await expect(page.getByText("TalentBridge India")).toBeVisible()
  })

  test("shows team members", async ({ page }) => {
    await expect(page.getByText("Team")).toBeVisible()
    await expect(page.getByText("Priya Sharma")).toBeVisible()
  })

  test("has View portal button", async ({ page }) => {
    await expect(page.getByRole("link", { name: /View portal/i })).toBeVisible()
  })
})

test.describe("AI usage page", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page)
    await page.goto("/admin/ai-usage")
  })

  test("shows AI usage metrics", async ({ page }) => {
    await expect(page.getByText("AI Usage & Costs")).toBeVisible()
    await expect(page.getByText("CV Summaries")).toBeVisible()
    await expect(page.getByText("AI Cost")).toBeVisible()
  })

  test("shows pipeline health", async ({ page }) => {
    await expect(page.getByText("Pipeline health")).toBeVisible()
    await expect(page.getByText("Completed")).toBeVisible()
  })

  test("shows token usage breakdown", async ({ page }) => {
    await expect(page.getByText("Token usage")).toBeVisible()
    await expect(page.getByText("Prompt tokens")).toBeVisible()
  })
})

test.describe("Audit logs page", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page)
    await page.goto("/admin/audit-logs")
  })

  test("shows audit log table", async ({ page }) => {
    await expect(page.getByText("Audit Logs")).toBeVisible()
    await expect(page.getByText("Actor")).toBeVisible()
    await expect(page.getByText("Action")).toBeVisible()
  })

  test("shows seeded audit events", async ({ page }) => {
    await expect(page.getByText(/VENDOR_APPROVED|COMPANY_CREATED|CANDIDATE/)).toBeVisible()
  })

  test("search filters audit logs", async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', "VENDOR_APPROVED")
    await page.click('button[type="submit"]')
    await page.waitForLoadState("networkidle")
    await expect(page.getByText("VENDOR_APPROVED")).toBeVisible()
  })
})

test.describe("Vendors admin page", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsSuperAdmin(page)
    await page.goto("/admin/vendors")
  })

  test("shows all vendors across all tenants", async ({ page }) => {
    await expect(page.getByText("All Vendors")).toBeVisible()
    await expect(page.getByText("TalentBridge India")).toBeVisible()
    await expect(page.getByText("CodeForce Staffing")).toBeVisible()
  })

  test("status tabs filter vendors", async ({ page }) => {
    await page.click('a[href*="status=APPROVED"]')
    await page.waitForLoadState("networkidle")
    await expect(page.getByText("TalentBridge India")).toBeVisible()
  })
})
