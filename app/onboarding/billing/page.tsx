// app/onboarding/billing/page.tsx
"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, ShieldCheck, Clock, CheckCircle2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { getPlanById } from "@/config/plans"
import { ROUTES } from "@/config/constants"
import { createCheckoutSession } from "@/services/billing.service"
import { cn } from "@/lib/utils"

const TRIAL_DAYS = 14

export default function BillingPage() {
  const router = useRouter()
  const [planId, setPlanId] = useState<string>("growth")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedPlan = sessionStorage.getItem("onboarding_plan") ?? "growth"
    const savedCycle = sessionStorage.getItem("onboarding_billing_cycle") as "monthly" | "annual" ?? "monthly"
    setPlanId(savedPlan)
    setBillingCycle(savedCycle)
  }, [])

  const plan = getPlanById(planId)

  const handleStartTrial = () => {
    setError(null)
    startTransition(async () => {
      const result = await createCheckoutSession({
        planId,
        billingCycle,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?onboarded=true`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/billing`,
      })

      if (!result.success || !result.url) {
        setError(result.error ?? "Failed to start checkout. Please try again.")
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = result.url
    })
  }

  const handleSkipBilling = () => {
    // Allow trial start without credit card (for dev/demo)
    startTransition(() => {
      router.push(`${ROUTES.DASHBOARD}?onboarded=true`)
    })
  }

  if (!plan) return null

  const price = billingCycle === "annual" ? plan.annualMonthlyEquivalent : plan.monthlyPrice
  const annualTotal = plan.annualPrice

  return (
    <div className="animate-fade-in">
      <StepIndicator currentStep={5} />

      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Start your free trial</h1>
          <p className="text-muted-foreground mt-1">
            {TRIAL_DAYS} days free, then ${price}/month. Cancel anytime.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order summary */}
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <h2 className="font-semibold">Order summary</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{plan.displayName} Plan</p>
                <p className="text-sm text-muted-foreground capitalize">{billingCycle} billing</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${price}/mo</p>
                {billingCycle === "annual" && (
                  <p className="text-xs text-muted-foreground">${annualTotal}/yr</p>
                )}
              </div>
            </div>

            {/* Trial line */}
            <div className="flex items-center justify-between py-3 border-t border-b">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">{TRIAL_DAYS}-day free trial</p>
              </div>
              <p className="text-sm font-semibold text-success">$0 today</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">First charge after trial</p>
              <p className="text-sm font-medium">
                {billingCycle === "annual" ? `$${annualTotal}` : `$${price}`}
              </p>
            </div>
          </div>

          {/* Plan includes */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Included in {plan.displayName}
            </p>
            <ul className="space-y-1.5">
              {plan.features.filter((f) => f.included).slice(0, 6).map((feature) => (
                <li key={feature.text} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  {feature.text}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => router.push(ROUTES.ONBOARDING_PLAN)}
            className="text-xs text-primary hover:underline"
          >
            Change plan
          </button>
        </div>

        {/* Payment & trust */}
        <div className="space-y-5">
          {/* Trust signals */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-semibold">Why add a card?</h2>
            <ul className="space-y-3">
              {[
                {
                  icon: Clock,
                  title: `${TRIAL_DAYS} days completely free`,
                  desc: "You won't be charged anything today.",
                },
                {
                  icon: ShieldCheck,
                  title: "Cancel anytime",
                  desc: "No commitments. Cancel before trial ends and pay nothing.",
                },
                {
                  icon: Zap,
                  title: "Seamless activation",
                  desc: "After trial, your workspace continues without interruption.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span>
              Payment processed securely by{" "}
              <a href="https://stripe.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Stripe
              </a>
              . VendorFlow never stores your card details.
            </span>
          </div>

          {/* CTA */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleStartTrial}
            loading={isPending}
          >
            {!isPending && (
              <>
                <CreditCard className="h-4 w-4" />
                Start {TRIAL_DAYS}-day free trial
              </>
            )}
            {isPending && "Redirecting to checkout…"}
          </Button>

          {/* Dev skip */}
          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              onClick={handleSkipBilling}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              [Dev] Skip billing — go to dashboard
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-start mt-8">
        <Button
          variant="ghost"
          onClick={() => router.push(ROUTES.ONBOARDING_PLAN)}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plans
        </Button>
      </div>
    </div>
  )
}
