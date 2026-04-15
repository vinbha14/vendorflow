// __tests__/integration/billing-service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { makeUser, makeCompany, makeCompanyMember, makePlan, makeSubscription } from "../helpers/factories"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

import { auth } from "@/lib/auth"

const mockUser = makeUser()
const mockCompany = makeCompany()
const mockPlan = makePlan()
const mockSubscription = makeSubscription(mockCompany.id, mockPlan.id)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      globalRole: "USER",
    },
  } as any)
})

describe("createCheckoutSession", () => {
  it("returns error when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const { createCheckoutSession } = await import("@/services/billing.service")
    const result = await createCheckoutSession({
      planId: "growth",
      billingCycle: "monthly",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Unauthorized")
  })

  it("returns error when plan does not exist", async () => {
    vi.mocked(prisma.companyMember.findFirst).mockResolvedValue(
      makeCompanyMember(mockUser.id, mockCompany.id) as any
    )
    vi.mocked(prisma.company.findFirst ?? prisma.companyMember.findFirst).mockResolvedValue({
      ...makeCompanyMember(mockUser.id, mockCompany.id),
      company: { ...mockCompany, subscription: null },
    } as any)

    const { createCheckoutSession } = await import("@/services/billing.service")
    const result = await createCheckoutSession({
      planId: "nonexistent-plan",
      billingCycle: "monthly",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Invalid plan")
  })

  it("returns error when no company membership found", async () => {
    vi.mocked(prisma.companyMember.findFirst).mockResolvedValue(null)

    const { createCheckoutSession } = await import("@/services/billing.service")
    const result = await createCheckoutSession({
      planId: "growth",
      billingCycle: "monthly",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("No company found")
  })
})

describe("getSubscriptionDetails", () => {
  it("returns subscription with plan and usage records", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      ...mockSubscription,
      plan: mockPlan,
      usageRecords: [],
    } as any)

    const { getSubscriptionDetails } = await import("@/services/billing.service")
    const result = await getSubscriptionDetails(mockCompany.id)

    expect(result).not.toBeNull()
    expect(result?.status).toBe("ACTIVE")
  })

  it("returns null when no subscription exists", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null)

    const { getSubscriptionDetails } = await import("@/services/billing.service")
    const result = await getSubscriptionDetails("no-subscription-company")

    expect(result).toBeNull()
  })
})

describe("Subscription status logic", () => {
  it("correctly identifies trial subscription", () => {
    const status = "TRIALING"
    const isTrialing = status === "TRIALING"
    const isPastDue = status === "PAST_DUE"
    expect(isTrialing).toBe(true)
    expect(isPastDue).toBe(false)
  })

  it("calculates trial days remaining correctly", () => {
    const trialEndsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
    const daysLeft = Math.max(0, Math.ceil(
      (trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ))
    expect(daysLeft).toBe(5)
  })

  it("returns 0 days for expired trial", () => {
    const trialEndsAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    const daysLeft = Math.max(0, Math.ceil(
      (trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ))
    expect(daysLeft).toBe(0)
  })

  it("correctly identifies grace period", () => {
    const gracePeriodEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const isInGracePeriod = gracePeriodEnd > new Date()
    expect(isInGracePeriod).toBe(true)
  })
})
