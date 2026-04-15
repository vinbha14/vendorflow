// playwright.config.ts
import { defineConfig, devices } from "@playwright/test"

const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:3000"

export default defineConfig({
  testDir: "__tests__/e2e",
  fullyParallel: false, // Tests share DB state — run sequentially
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    // Auth state is stored per test — each test manages its own session
    ignoreHTTPSErrors: true,
  },

  projects: [
    // Desktop Chrome — primary
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Mobile Safari — for responsive layout checks
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
      testMatch: "**/responsive.spec.ts",
    },
  ],

  // Start the dev server if not already running
  webServer: process.env["CI"]
    ? undefined
    : {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
