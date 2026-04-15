// app/admin/billing/page.tsx
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, DollarSign, TrendingUp, AlertTriangle } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { PLANS } from "@/config/plans"

export const metadata = { title: "Billing Overview — Admin" }

export default async function AdminBillingPage() {
  const subscriptions = await prisma.subscription.findMany({
    include: { plan: true, company: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  })

  const active = subscriptions.filter((s) => s.status === "ACTIVE")
  const trialing = subscriptions.filter((s) => s.status === "TRIALING")
  const pastDue = subscriptions.filter((s) => s.status === "PAST_DUE")
  const canceled = subscriptions.filter((s) => s.status === "CANCELED")

  // Rough MRR estimate from plan prices
  const mrr = active.reduce((sum, s) => {
    const plan = PLANS.find((p) => p.id === s.plan.name)
    if (!plan) return sum
    const monthly = s.billingCycle === "ANNUAL"
      ? plan.annualMonthlyEquivalent
      : plan.monthlyPrice
    return sum + monthly
  }, 0)

  const arr = mrr * 12

  return (
    <div className="space-y-8">
      <PageHeader title="Billing &amp; Revenue" description="Subscription health across all tenants." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Estimated MRR" value={`$${mrr.toLocaleString()}`} subtitle="Monthly recurring revenue" icon={DollarSign} iconColor="text-green-500" />
        <KpiCard title="Estimated ARR" value={`$${arr.toLocaleString()}`} subtitle="Annual run rate" icon={TrendingUp} iconColor="text-blue-500" />
        <KpiCard title="Active subscriptions" value={active.length} subtitle={`${trialing.length} trialing`} icon={CreditCard} iconColor="text-purple-500" />
        <KpiCard title="Past due" value={pastDue.length} subtitle={pastDue.length > 0 ? "Need attention" : "All healthy"} icon={AlertTriangle} iconColor={pastDue.length > 0 ? "text-red-500" : "text-green-500"} />
      </div>

      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base font-semibold">All subscriptions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <div className="grid grid-cols-12 gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-secondary/30">
              <span className="col-span-4">Company</span>
              <span className="col-span-2">Plan</span>
              <span className="col-span-2">Billing</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-2">Renews</span>
            </div>
            {subscriptions.map((sub) => (
              <div key={sub.id} className="grid grid-cols-12 gap-3 px-6 py-3.5 items-center text-sm hover:bg-muted/20">
                <div className="col-span-4 min-w-0">
                  <p className="font-medium truncate">{sub.company.name}</p>
                  <p className="text-xs text-muted-foreground">{sub.company.slug}.vendorflow.com</p>
                </div>
                <div className="col-span-2 text-sm">{sub.plan.displayName}</div>
                <div className="col-span-2 text-sm capitalize">{sub.billingCycle.toLowerCase()}</div>
                <div className="col-span-2">
                  <StatusBadge status={sub.status} type="subscription" showDot />
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : sub.trialEndsAt ? `Trial ends ${formatDate(sub.trialEndsAt)}` : "—"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
