// app/api/webhooks/stripe/route.ts
// Handles all Stripe webhook events for subscription management.
// This route must be excluded from auth middleware (already handled in middleware.ts).

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { AUDIT_ACTIONS } from "@/config/constants"

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "", {
  apiVersion: "2025-02-24.acacia",
})

const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"] ?? ""

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  console.log(`[Stripe Webhook] Processing: ${event.type}`)

  try {
    switch (event.type) {
      // ─── Checkout completed — customer paid / started trial ───────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      // ─── Subscription created ─────────────────────────────────────────────
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription)
        break
      }

      // ─── Subscription updated (plan change, status change) ────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      // ─── Subscription deleted (canceled) ─────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      // ─── Invoice payment succeeded ────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      // ─── Invoice payment failed ───────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      // ─── Trial ending soon (3 days before) ───────────────────────────────
      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription
        await handleTrialWillEnd(subscription)
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const companyId = session.metadata?.["companyId"] ?? session.client_reference_id
  if (!companyId) return

  const planId = session.metadata?.["planId"]
  const billingCycle = session.metadata?.["billingCycle"] as "monthly" | "annual" | undefined

  if (!planId) return

  const dbPlan = await prisma.plan.findFirst({ where: { name: planId } })
  if (!dbPlan) return

  await prisma.subscription.upsert({
    where: { companyId },
    update: {
      planId: dbPlan.id,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      stripePriceId: session.line_items?.data[0]?.price?.id,
      status: "TRIALING",
      billingCycle: (billingCycle?.toUpperCase() as "MONTHLY" | "ANNUAL") ?? "MONTHLY",
    },
    create: {
      companyId,
      planId: dbPlan.id,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      status: "TRIALING",
      billingCycle: (billingCycle?.toUpperCase() as "MONTHLY" | "ANNUAL") ?? "MONTHLY",
    },
  })

  await writeAuditLog(companyId, AUDIT_ACTIONS.SUBSCRIPTION_CREATED, "Subscription", companyId, {
    planId,
    billingCycle,
  })
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const companyId = subscription.metadata?.["companyId"]
  if (!companyId) return

  const status = mapStripeStatus(subscription.status)
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStartsAt: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const dbSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { plan: true },
  })
  if (!dbSub) return

  const status = mapStripeStatus(subscription.status)
  const newPriceId = subscription.items.data[0]?.price?.id

  // Detect plan change
  let planId = dbSub.planId
  if (newPriceId && newPriceId !== dbSub.stripePriceId) {
    const newPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { stripePriceIdMonthly: newPriceId },
          { stripePriceIdAnnual: newPriceId },
        ],
      },
    })
    if (newPlan) planId = newPlan.id
  }

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      planId,
      stripePriceId: newPriceId,
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  })

  if (status === "ACTIVE" && dbSub.status !== "ACTIVE") {
    await writeAuditLog(dbSub.companyId, AUDIT_ACTIONS.SUBSCRIPTION_UPGRADED, "Subscription", dbSub.id, {
      newStatus: status,
      planId,
    })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const dbSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  })
  if (!dbSub) return

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  })

  await writeAuditLog(dbSub.companyId, AUDIT_ACTIONS.SUBSCRIPTION_CANCELED, "Subscription", dbSub.id, {})
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const stripeCustomerId = invoice.customer as string
  const dbSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId },
  })
  if (!dbSub) return

  // Clear past_due if it was set
  await prisma.subscription.updateMany({
    where: { stripeCustomerId },
    data: {
      status: "ACTIVE",
      pastDueSince: null,
      gracePeriodEndsAt: null,
    },
  })

  // Send receipt notification (email handled separately via Resend)
  await prisma.notification.create({
    data: {
      userId: await getCompanyAdminUserId(dbSub.companyId),
      companyId: dbSub.companyId,
      type: "PAYMENT_SUCCEEDED",
      title: "Payment successful",
      body: `Your payment of $${(invoice.amount_paid / 100).toFixed(2)} was processed successfully.`,
      link: "/dashboard/billing",
    },
  }).catch(() => {}) // Non-critical
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const stripeCustomerId = invoice.customer as string
  const dbSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId },
  })
  if (!dbSub) return

  const gracePeriodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.subscription.updateMany({
    where: { stripeCustomerId },
    data: {
      status: "PAST_DUE",
      pastDueSince: new Date(),
      gracePeriodEndsAt: gracePeriodEnd,
    },
  })

  // Send billing alert notification
  const adminUserId = await getCompanyAdminUserId(dbSub.companyId)
  await prisma.notification.create({
    data: {
      userId: adminUserId,
      companyId: dbSub.companyId,
      type: "BILLING_PAYMENT_FAILED",
      title: "Payment failed",
      body: "We couldn't process your payment. Please update your payment method to avoid service interruption.",
      link: "/dashboard/billing",
    },
  }).catch(() => {})

  await writeAuditLog(dbSub.companyId, AUDIT_ACTIONS.PAYMENT_FAILED, "Subscription", dbSub.id, {
    gracePeriodEnd,
  })
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const companyId = subscription.metadata?.["companyId"]
  if (!companyId) return

  const adminUserId = await getCompanyAdminUserId(companyId)
  await prisma.notification.create({
    data: {
      userId: adminUserId,
      companyId,
      type: "BILLING_TRIAL_ENDING",
      title: "Trial ending in 3 days",
      body: "Your 14-day free trial ends in 3 days. Add a payment method to continue without interruption.",
      link: "/dashboard/billing",
    },
  }).catch(() => {})
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "PAUSED" | "UNPAID" {
  const map: Record<string, "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "PAUSED" | "UNPAID"> = {
    trialing: "TRIALING",
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "CANCELED",
    paused: "PAUSED",
    unpaid: "UNPAID",
  }
  return map[stripeStatus] ?? "ACTIVE"
}

async function getCompanyAdminUserId(companyId: string): Promise<string> {
  const admin = await prisma.companyMember.findFirst({
    where: { companyId, role: "COMPANY_ADMIN", isActive: true },
    select: { userId: true },
  })
  return admin?.userId ?? ""
}

async function writeAuditLog(
  companyId: string,
  action: string,
  entity,
      entityId,
      after: after as import("@prisma/client").Prisma.InputJsonValue,
) {
  const admin = await prisma.companyMember.findFirst({
    where: { companyId, role: "COMPANY_ADMIN", isActive: true },
    select: { userId: true, user: { select: { email: true } } },
  })
  if (!admin) return

  await prisma.auditLog.create({
    data: {
      companyId,
      actorId: admin.userId,
      actorEmail: admin.user.email,
      actorRole: "SYSTEM",
      action,
      entity,
      entityId,
      after,
    },
  }).catch(console.error)
}
