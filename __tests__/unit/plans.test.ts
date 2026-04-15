// __tests__/unit/plans.test.ts
import { describe, it, expect } from "vitest"
import { PLANS, getPlanById, getPlanLimits, formatPlanPrice, ANNUAL_DISCOUNT_PERCENT, TRIAL_DAYS } from "@/config/plans"

describe("PLANS config", () => {
  it("has exactly 4 plans", () => {
    expect(PLANS).toHaveLength(4)
  })

  it("plan IDs are unique", () => {
    const ids = PLANS.map((p) => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(PLANS.length)
  })

  it("each plan has required fields", () => {
    for (const plan of PLANS) {
      expect(plan.id).toBeTruthy()
      expect(plan.displayName).toBeTruthy()
      expect(plan.maxVendors).toBeDefined()
      expect(plan.features).toBeInstanceOf(Array)
      expect(plan.features.length).toBeGreaterThan(0)
    }
  })

  it("plans are in ascending order of vendor count", () => {
    const vendorLimits = PLANS.filter((p) => p.maxVendors !== -1).map((p) => p.maxVendors)
    for (let i = 1; i < vendorLimits.length; i++) {
      expect(vendorLimits[i]!).toBeGreaterThan(vendorLimits[i - 1]!)
    }
  })

  it("enterprise plan has unlimited vendors", () => {
    const enterprise = PLANS.find((p) => p.id === "enterprise")
    expect(enterprise?.maxVendors).toBe(-1)
  })

  it("growth plan is featured (most popular)", () => {
    const growth = PLANS.find((p) => p.id === "growth")
    expect(growth?.isFeatured).toBe(true)
    expect(growth?.badgeText).toBe("Most Popular")
  })

  it("annual price is less than 12x monthly (has discount)", () => {
    for (const plan of PLANS.filter((p) => p.monthlyPrice > 0)) {
      expect(plan.annualPrice).toBeLessThan(plan.monthlyPrice * 12)
    }
  })
})

describe("getPlanById", () => {
  it("returns the correct plan", () => {
    const plan = getPlanById("starter")
    expect(plan).toBeDefined()
    expect(plan?.id).toBe("starter")
    expect(plan?.maxVendors).toBe(10)
  })

  it("returns undefined for non-existent plan", () => {
    expect(getPlanById("nonexistent")).toBeUndefined()
  })
})

describe("getPlanLimits", () => {
  it("returns correct limits for growth plan", () => {
    const limits = getPlanLimits("growth")
    expect(limits.maxVendors).toBe(50)
    expect(limits.maxTeamMembers).toBe(10)
  })

  it("returns 0 for unknown plan", () => {
    const limits = getPlanLimits("unknown")
    expect(limits.maxVendors).toBe(0)
    expect(limits.maxTeamMembers).toBe(0)
  })
})

describe("formatPlanPrice", () => {
  it("formats monthly price correctly", () => {
    const plan = getPlanById("starter")!
    expect(formatPlanPrice(plan, "monthly")).toBe("$49")
  })

  it("formats annual (monthly equivalent) price correctly", () => {
    const plan = getPlanById("starter")!
    expect(formatPlanPrice(plan, "annual")).toBe("$39")
  })

  it("returns 'Custom' for enterprise plan", () => {
    const plan = getPlanById("enterprise")!
    expect(formatPlanPrice(plan, "monthly")).toBe("Custom")
  })
})

describe("Annual discount", () => {
  it("annual discount is 20%", () => {
    expect(ANNUAL_DISCOUNT_PERCENT).toBe(20)
  })

  it("starter annual equivalent is 20% less than monthly * 12", () => {
    const plan = getPlanById("starter")!
    const annualIfNoDiscount = plan.monthlyPrice * 12  // $588
    const actualAnnual = plan.annualPrice             // $470
    const discount = (annualIfNoDiscount - actualAnnual) / annualIfNoDiscount
    expect(discount).toBeCloseTo(0.2, 1)
  })
})

describe("Trial period", () => {
  it("trial is 14 days", () => {
    expect(TRIAL_DAYS).toBe(14)
  })
})
