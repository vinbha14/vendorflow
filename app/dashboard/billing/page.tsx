// app/dashboard/billing/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BillingPortalButton } from "@/components/billing/billing-portal-button"
import { formatDate } from "@/lib/utils"
import {
  CreditCard, CheckCircle2, AlertTriangle, Building2,
  TrendingUp, Calendar, Zap, ArrowRight,
} from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Billing" }

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  // Only admins can view billing
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: tenantId } },
  })
  if (!membership || membership.role !== "COMPANY_ADMIN") redirect(ROUTES.DASHBOARD)

  const subscription = await prisma.subscription.findUnique({
    where: { companyId: tenantId },
    include: {
      plan: true,
      usageRecords: {
        orderBy: { recordedAt: "desc" },
        take: 30,
      },
    },
  })

  // Vendor count for usage display
  const activeVendorCount = await prisma.vendorCompany.count({
    where: { companyId: tenantId, status: "APPROVED" },
  })

  const maxVendors = subscription?.plan.maxVendors ?? 10
  const vendorUsagePct = maxVendors === -1 ? 0 : Math.min(100, Math.round((activeVendorCount / maxVendors) * 100))
  const isNearLimit = vendorUsagePct >= 80
  const isAtLimit = vendorUsagePct >= 100

  const isTrialing = subscription?.status === "TRIALING"
  const isPastDue = subscription?.status === "PAST_DUE"
  const isCanceled = subscription?.status === "CANCELED"
  const trialDaysLeft = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Billing"
        description="Manage your subscription, view usage, and update payment details."
      />

      {/* Alerts */}
      {isPastDue && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive text-sm">Payment failed</p>
            <p className="text-sm text-destructive/80 mt-0.5">
              Your last payment could not be processed. Update your payment method to avoid service interruption.
              {subscription?.gracePeriodEndsAt && (
                <> Your workspace will be suspended on <strong>{formatDate(subscription.gracePeriodEndsAt)}</strong>.</>
              )}
            </p>
          </div>
        </div>
      )}

      {isTrialing && trialDaysLeft !== null && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-primary text-sm">
              Free trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining
            </p>
            <p className="text-sm text-primary/80 mt-0.5">
              After your trial ends, you'll be charged for the {subscription?.plan.displayName} plan.
              Add a payment method to ensure no interruption.
            </p>
          </div>
          {subscription?.stripeCustomerId && (
            <BillingPortalButton
              companyId={tenantId}
              variant="outline"
              size="sm"
              label="Add payment method"
            />
          )}
        </div>
      )}

      {isAtLimit && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Vendor limit reached</p>
            <p className="text-sm text-amber-700 mt-0.5">
              You've reached the maximum number of vendors on your current plan. Upgrade to add more.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">{subscription.plan.displayName}</h3>
                    <StatusBadge status={subscription.status} type="subscription" showDot />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">
                    {subscription.billingCycle.toLowerCase()} billing
                    {subscription.currentPeriodEnd && (
                      <> · Renews {formatDate(subscription.currentPeriodEnd)}</>
                    )}
                  </p>
                  {subscription.cancelAtPeriodEnd && (
                    <Badge variant="warning" className="mt-2 text-xs">
                      Cancels {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : "at period end"}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ${subscription.billingCycle === "ANNUAL"
                      ? subscription.plan.annualPrice.toString()
                      : subscription.plan.monthlyPrice.toString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    / {subscription.billingCycle === "ANNUAL" ? "year" : "month"}
                  </p>
                </div>
              </div>

              {/* Plan features */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Vendors", value: maxVendors === -1 ? "Unlimited" : maxVendors },
                  { label: "Team members", value: subscription.plan.maxTeamMembers === -1 ? "Unlimited" : subscription.plan.maxTeamMembers },
                  { label: "AI summaries", value: subscription.plan.hasAiSummaries ? "Included" : "Not included" },
                  { label: "Duplicate detection", value: subscription.plan.hasDuplicateDetection ? "Included" : "Not included" },
                  { label: "API access", value: subscription.plan.hasApiAccess ? "Included" : "Not available" },
                  { label: "Audit logs", value: subscription.plan.hasAuditLogs ? "Included" : "Not available" },
                ].map((feature) => (
                  <div key={feature.label} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                    <span className="text-muted-foreground">{feature.label}:</span>
                    <span className="font-medium">{String(feature.value)}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t">
                {subscription.stripeCustomerId && (
                  <BillingPortalButton
                    companyId={tenantId}
                    variant="default"
                    size="default"
                    label="Manage subscription"
                  />
                )}
                <Button variant="outline" asChild>
                  <Link href={ROUTES.PRICING}>View all plans</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">No active subscription found.</p>
              <Button asChild>
                <Link href={ROUTES.ONBOARDING_PLAN}>Choose a plan</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vendor usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Active vendors</span>
              </div>
              <span className="text-sm font-semibold">
                {activeVendorCount}
                {maxVendors !== -1 && (
                  <span className="text-muted-foreground font-normal"> / {maxVendors}</span>
                )}
              </span>
            </div>
            {maxVendors !== -1 && (
              <>
                <Progress
                  value={vendorUsagePct}
                  className={`h-2 ${isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-amber-500" : ""}`}
                />
                <p className="text-xs text-muted-foreground">
                  {isAtLimit
                    ? "You've reached your vendor limit. Upgrade to add more."
                    : isNearLimit
                    ? `${maxVendors - activeVendorCount} vendor slots remaining before limit.`
                    : `${maxVendors - activeVendorCount} vendor slots remaining.`}
                </p>
              </>
            )}
          </div>

          {/* Usage history chart placeholder */}
          {subscription?.usageRecords && subscription.usageRecords.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Vendor count history (30 days)
              </p>
              <div className="flex items-end gap-1 h-16">
                {subscription.usageRecords.slice(0, 30).reverse().map((record, i) => {
                  const pct = maxVendors === -1 ? 50 : (record.vendorCount / maxVendors) * 100
                  return (
                    <div
                      key={record.id}
                      className="flex-1 bg-primary/20 rounded-sm hover:bg-primary/40 transition-colors relative group"
                      style={{ height: `${Math.max(8, pct)}%` }}
                      title={`${record.vendorCount} vendors · ${formatDate(record.recordedAt)}`}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing details */}
      {subscription?.stripeCustomerId && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Payment &amp; Invoices</CardTitle>
              <BillingPortalButton
                companyId={tenantId}
                variant="ghost"
                size="sm"
                label="View all invoices →"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Payment method on file</p>
                <p className="text-xs text-muted-foreground">
                  Managed securely via Stripe. Click &ldquo;Manage subscription&rdquo; to update.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger zone */}
      {!isCanceled && subscription?.stripeCustomerId && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cancel your subscription through the billing portal. Your workspace remains active until the end of the current billing period.
            </p>
            <BillingPortalButton
              companyId={tenantId}
              variant="outline"
              size="sm"
              label="Cancel subscription"
              className="border-destructive/30 text-destructive hover:bg-destructive/5"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
