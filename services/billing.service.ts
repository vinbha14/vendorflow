// services/billing.service.ts
"use server"

import Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { PLANS, TRIAL_DAYS } from "@/config/plans"

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia",
})

// ─────────────────────────────────────────────────────────────────────────────
// Create Stripe Checkout session for onboarding
// ─────────────────────────────────────────────────────────────────────────────
export async function createCheckoutSession(input: {
  planId: string
  billingCycle: "monthly" | "annual"
  successUrl: string
  cancelUrl: string
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const { planId, billingCycle, successUrl, cancelUrl } = input

  // Get plan details
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) return { success: false, error: "Invalid plan" }

  // Get user's company
  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { company: { include: { subscription: true } } },
  })
  if (!membership) return { success: false, error: "No company found" }

  const { company } = membership

  // Get or create Stripe customer
  let stripeCustomerId = company.subscription?.stripeCustomerId

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: company.name,
      metadata: {
        companyId: company.id,
        userId: session.user.id,
      },
    })
    stripeCustomerId = customer.id

    // Save customer ID immediately
    await prisma.subscription.upsert({
      where: { companyId: company.id },
      update: { stripeCustomerId },
      create: {
        companyId: company.id,
        planId: (await prisma.plan.findFirst({ where: { name: planId } }))!.id,
        stripeCustomerId,
        status: "TRIALING",
        billingCycle: billingCycle.toUpperCase() as "MONTHLY" | "ANNUAL",
      },
    })
  }

  // Get the Stripe price ID
  const priceId =
    billingCycle === "annual"
      ? plan.stripePriceIdAnnual
      : plan.stripePriceIdMonthly

  if (!priceId || priceId.includes("placeholder")) {
    // In development without real Stripe keys, simulate success
    if (process.env["NODE_ENV"] === "development") {
      // Update subscription to trialing
      const dbPlan = await prisma.plan.findFirst({ where: { name: planId } })
      if (dbPlan) {
        await prisma.subscription.upsert({
          where: { companyId: company.id },
          update: {
            planId: dbPlan.id,
            status: "TRIALING",
            billingCycle: billingCycle.toUpperCase() as "MONTHLY" | "ANNUAL",
            trialStartsAt: new Date(),
            trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
          },
          create: {
            companyId: company.id,
            planId: dbPlan.id,
            status: "TRIALING",
            billingCycle: billingCycle.toUpperCase() as "MONTHLY" | "ANNUAL",
            trialStartsAt: new Date(),
            trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
          },
        })
      }
      return { success: true, url: successUrl }
    }
    return { success: false, error: "Stripe price ID not configured. Please contact support." }
  }

  // Create Stripe Checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: {
        companyId: company.id,
        planId,
        billingCycle,
      },
    },
    success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    client_reference_id: company.id,
    metadata: {
      companyId: company.id,
      planId,
      billingCycle,
    },
    allow_promotion_codes: true,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    customer_update: { address: "auto" },
  })

  return { success: true, url: checkoutSession.url! }
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Stripe Customer Portal URL (for subscription management)
// ─────────────────────────────────────────────────────────────────────────────
export async function getCustomerPortalUrl(
  companyId: string,
  returnUrl: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
    select: { stripeCustomerId: true },
  })

  if (!subscription?.stripeCustomerId) {
    return { success: false, error: "No billing information found." }
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  })

  return { success: true, url: portalSession.url }
}

// ─────────────────────────────────────────────────────────────────────────────
// Get subscription details for billing page
// ─────────────────────────────────────────────────────────────────────────────
export async function getSubscriptionDetails(companyId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
    include: {
      plan: true,
      usageRecords: {
        orderBy: { recordedAt: "desc" },
        take: 30,
      },
    },
  })

  return subscription
}
