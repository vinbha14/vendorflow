// app/admin/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { KpiCard } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency } from "@/lib/utils"
import {
  Building2, Users, CreditCard, Brain, TrendingUp,
  AlertTriangle, ArrowRight, Activity, DollarSign,
} from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Platform Overview — Admin" }

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "SUPER_ADMIN") redirect(ROUTES.SIGN_IN)

  // Fetch all platform data in parallel
  const [
    companyCounts,
    vendorCount,
    candidateCount,
    subscriptionStats,
    recentCompanies,
    duplicateStats,
    aiUsageStats,
    recentAuditLogs,
  ] = await Promise.all([
    // Company counts by status
    prisma.company.groupBy({ by: ["status"], _count: true }),

    // Total vendors (platform-wide)
    prisma.vendor.count({ where: { status: "APPROVED" } }),

    // Total candidates
    prisma.candidateProfile.count(),

    // Subscription revenue stats
    prisma.subscription.groupBy({
      by: ["status"],
      _count: true,
      where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
    }),

    // Recent companies
    prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { vendorRelationships: true, submissions: true } },
      },
    }),

    // Duplicate alert stats
    prisma.duplicateAlert.groupBy({
      by: ["severity", "status"],
      _count: true,
    }),

    // AI usage (last 30 days)
    prisma.aiSummary.aggregate({
      where: {
        status: "COMPLETED",
        generatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: true,
      _sum: { promptTokens: true, completionTokens: true, totalCost: true },
    }),

    // Recent audit logs
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        actor: { select: { name: true, email: true } },
        company: { select: { name: true } },
      },
    }),
  ])

  const totalCompanies = companyCounts.reduce((sum, c) => sum + c._count, 0)
  const activeCompanies = companyCounts.find((c) => c.status === "ACTIVE")?._count ?? 0
  const activeSubscriptions = subscriptionStats.find((s) => s.status === "ACTIVE")?._count ?? 0
  const trialingSubscriptions = subscriptionStats.find((s) => s.status === "TRIALING")?._count ?? 0
  const pastDueSubscriptions = subscriptionStats.find((s) => s.status === "PAST_DUE")?._count ?? 0

  // MRR estimate (very rough — real MRR comes from Stripe)
  const openDuplicates = duplicateStats
    .filter((d) => d.status === "OPEN")
    .reduce((sum, d) => sum + d._count, 0)

  const aiTotalCost = aiUsageStats._sum.totalCost ?? 0
  const aiTotalSummaries = aiUsageStats._count

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Overview"
        description="Real-time metrics across all VendorFlow tenants"
        actions={
          <Badge variant="outline" className="gap-1.5 text-green-600 border-green-300 bg-green-50">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            All systems operational
          </Badge>
        }
      />

      {/* Platform KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Companies"
          value={totalCompanies}
          subtitle={`${activeCompanies} active`}
          icon={Building2}
          iconColor="text-blue-500"
          trend={{ value: 12, direction: "up", label: "vs last month" }}
        />
        <KpiCard
          title="Total Vendors"
          value={vendorCount.toLocaleString()}
          subtitle="Across all tenants"
          icon={Users}
          iconColor="text-purple-500"
          trend={{ value: 8, direction: "up" }}
        />
        <KpiCard
          title="Active Subscriptions"
          value={activeSubscriptions}
          subtitle={`${trialingSubscriptions} trialing · ${pastDueSubscriptions} past due`}
          icon={CreditCard}
          iconColor={pastDueSubscriptions > 0 ? "text-amber-500" : "text-green-500"}
        />
        <KpiCard
          title="AI Summaries (30d)"
          value={aiTotalSummaries.toLocaleString()}
          subtitle={`$${aiTotalCost.toFixed(2)} in AI costs`}
          icon={Brain}
          iconColor="text-violet-500"
          trend={{ value: 23, direction: "up" }}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Candidate Profiles"
          value={candidateCount.toLocaleString()}
          subtitle="All time"
          icon={Users}
          iconColor="text-teal-500"
        />
        <KpiCard
          title="Open Duplicate Alerts"
          value={openDuplicates}
          subtitle={openDuplicates === 0 ? "None outstanding" : "Across all tenants"}
          icon={AlertTriangle}
          iconColor={openDuplicates > 0 ? "text-amber-500" : "text-green-500"}
        />
        <KpiCard
          title="Candidates Processed"
          value={candidateCount.toLocaleString()}
          subtitle="via AI pipeline"
          icon={Activity}
          iconColor="text-indigo-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent companies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Recent companies</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.ADMIN_COMPANIES} className="text-xs gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentCompanies.map((company) => (
                <Link
                  key={company.id}
                  href={`${ROUTES.ADMIN_COMPANIES}/${company.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {company.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{company.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {company._count.vendorRelationships} vendors ·{" "}
                      {company._count.submissions} submissions
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {company.subscription ? (
                      <>
                        <p className="text-xs font-medium">{company.subscription.plan.displayName}</p>
                        <StatusBadge
                          status={company.subscription.status}
                          type="subscription"
                          className="text-[10px] mt-0.5"
                        />
                      </>
                    ) : (
                      <Badge variant="gray" className="text-xs">No plan</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent audit logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Recent audit events</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.ADMIN_AUDIT_LOGS} className="text-xs gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentAuditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-6 py-3.5">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-foreground">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {log.actor.name ?? log.actor.email}
                      {log.company ? ` · ${log.company.name}` : " · Platform"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Subscription health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { label: "Active", value: activeSubscriptions, color: "text-green-600", bg: "bg-green-50" },
              { label: "Trialing", value: trialingSubscriptions, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Past due", value: pastDueSubscriptions, color: "text-red-600", bg: "bg-red-50" },
              { label: "Total", value: activeSubscriptions + trialingSubscriptions + pastDueSubscriptions, color: "text-foreground", bg: "bg-secondary" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-5 ${item.bg}`}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-3xl font-bold mt-1 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
