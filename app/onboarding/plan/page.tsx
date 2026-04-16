// app/onboarding/plan/page.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowLeft, Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { PLANS, type Plan } from "@/config/plans"
import { ROUTES } from "@/config/constants"
import { cn } from "@/lib/utils"

export default function PlanPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const [selectedPlan, setSelectedPlan] = useState<string>("growth")
  const [isPending, startTransition] = useTransition()

  const displayPlans = PLANS.filter((p) => p.id !== "enterprise")

  const handleContinue = () => {
    startTransition(() => {
      sessionStorage.setItem("onboarding_plan", selectedPlan)
      sessionStorage.setItem("onboarding_billing_cycle", billingCycle)
      router.push(ROUTES.ONBOARDING_BILLING)
    })
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <StepIndicator currentStep={4} />

      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Choose your plan</h1>
        <p className="text-muted-foreground mt-1">
          Start with a 14-day free trial. No credit card required to begin.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={cn("text-sm", billingCycle === "monthly" ? "text-foreground font-medium" : "text-muted-foreground")}>
          Monthly
        </span>
        <button
          type="button"
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            billingCycle === "annual" ? "bg-primary" : "bg-input"
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
              billingCycle === "annual" ? "translate-x-6" : "translate-x-0.5"
            )}
          />
        </button>
        <span className={cn("text-sm flex items-center gap-1.5", billingCycle === "annual" ? "text-foreground font-medium" : "text-muted-foreground")}>
          Annual
          <Badge variant="success" className="text-xs">Save 20%</Badge>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {displayPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id
          const price = billingCycle === "annual" ? plan.annualMonthlyEquivalent : plan.monthlyPrice

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "relative flex flex-col text-left rounded-xl border-2 p-6 transition-all hover:shadow-card-hover",
                isSelected ? "border-primary shadow-brand" : "border-border bg-card",
                plan.isFeatured && !isSelected && "border-primary/30"
              )}
            >
              {/* Popular badge */}
              {plan.badgeText && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white whitespace-nowrap">
                  {plan.badgeText}
                </span>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold text-foreground">{plan.displayName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{plan.tagline}</p>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                {billingCycle === "annual" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Billed ${plan.annualPrice}/year
                  </p>
                )}
              </div>

              <p className="text-sm font-medium text-muted-foreground mb-3">
                Up to {plan.maxVendors} vendors
              </p>

              <ul className="space-y-2">
                {plan.features.slice(0, 6).map((feature) => (
                  <li key={feature.text} className="flex items-center gap-2 text-xs">
                    <Check
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        feature.included ? "text-success" : "text-muted-foreground/30"
                      )}
                    />
                    <span className={feature.included ? "text-foreground" : "text-muted-foreground/50"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {/* Enterprise option */}
      <div className="flex items-center gap-4 rounded-xl border bg-secondary/30 p-5 mb-8">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground">
          <Zap className="h-5 w-5 text-background" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Need more than 200 vendors?</p>
          <p className="text-sm text-muted-foreground">
            Contact us for a custom Enterprise plan with unlimited vendors, dedicated support, and SSO.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="mailto:sales@vendorflow.com">Contact sales</a>
        </Button>
      </div>

      {/* Trial notice */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 px-5 py-4 text-sm text-center text-muted-foreground mb-8">
        🎉 <strong className="text-foreground">14-day free trial</strong> on all plans.
        You won&apos;t be charged until your trial ends. Cancel anytime.
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(ROUTES.ONBOARDING_SUBDOMAIN)}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Step 4 of 5</p>
          <Button size="lg" onClick={handleContinue} loading={isPending}>
            {!isPending && (
              <>
                Continue with {PLANS.find((p) => p.id === selectedPlan)?.displayName}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
            {isPending && "Loading…"}
          </Button>
        </div>
      </div>
    </div>
  )
}
