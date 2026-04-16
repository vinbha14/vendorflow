import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ROUTES, SUBMISSION_STATUS_LABELS } from "@/config/constants"
import { KpiCard } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"
import {
  Building2,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  // tenant resolved from membership below
  // Check if user has a company membership
  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { companyId: true },
  })

  if (!membership) redirect(ROUTES.ONBOARDING_COMPANY)

  const tenantId = membership.companyId
  if (!tenantId) redirect(ROUTES.ONBOARDING_COMPANY)

  // Fetch all dashboard data in parallel
  const [
    vendorStats,
    candidateStats,
    duplicateAlerts,
    recentSubmissions,
    subscription,
    recentActivity,
  ] = await Promise.all([
    // Vendor counts
    prisma.vendorCompany.groupBy({
      by: ["status"],
      where: { companyId: tenantId },
      _count: true,
    }),
    // Candidate submission counts by status
    prisma.candidateSubmission.groupBy({
      by: ["status"],
      where: { companyId: tenantId },
      _count: true,
    }),
    // Open duplicate alerts
    prisma.duplicateAlert.count({
      where: { companyId: tenantId, status: "OPEN" },
    }),
    // Recent submissions for activity feed
    prisma.candidateSubmission.findMany({
      where: { companyId: tenantId },
      orderBy: { submittedAt: "desc" },
      take: 8,
      include: {
        profile: { select: { fullName: true, currentTitle: true, skills: true } },
        vendor: { select: { name: true } },
      },
    }),
    // Subscription + plan info
    prisma.subscription.findUnique({
      where: { companyId: tenantId },
      include: { plan: true },
    }),
    // Audit log for recent activity
    prisma.auditLog.findMany({
      where: { companyId: tenantId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ])

  // Process vendor stats
  const approvedVendors = vendorStats.find((s) => s.status === "APPROVED")?._count ?? 0
  const pendingVendors = vendorStats.find((s) => s.status === "PENDING")?._count ?? 0
  const totalVendors = vendorStats.reduce((sum, s) => sum + s._count, 0)

  // Process candidate stats
  const totalSubmissions = candidateStats.reduce((sum, s) => sum + s._count, 0)
  const shortlisted = candidateStats.find((s) => s.status === "SHORTLISTED")?._count ?? 0
  const hired = candidateStats.find((s) => s.status === "HIRED")?._count ?? 0
  const underReview = candidateStats.find((s) => s.status === "UNDER_REVIEW")?._count ?? 0

  // Plan usage
  const maxVendors = subscription?.plan.maxVendors ?? 10
  const vendorUsagePercent = maxVendors === -1 ? 0 : Math.round((approvedVendors / maxVendors) * 100)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Good ${getGreeting()}, ${session.user.name?.split(" ")[0] ?? "there"} 👋`}
        actions={
          <Button asChild>
            <Link href={ROUTES.DASHBOARD_VENDORS_INVITE}>
              <Plus className="h-4 w-4" />
              Invite Vendor
            </Link>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Active Vendors"
          value={approvedVendors}
          subtitle={maxVendors === -1 ? "Unlimited plan" : `of ${maxVendors} on plan`}
          icon={Building2}
          iconColor="text-blue-500"
          trend={
            pendingVendors > 0
              ? { value: pendingVendors, direction: "neutral", label: `${pendingVendors} pending` }
              : undefined
          }
        />
        <KpiCard
          title="Total Submissions"
          value={totalSubmissions}
          subtitle={`${underReview} under review`}
          icon={UserCheck}
          iconColor="text-purple-500"
          trend={{ value: 12, direction: "up", label: "vs last month" }}
        />
        <KpiCard
          title="Shortlisted"
          value={shortlisted}
          subtitle={`${hired} hired this month`}
          icon={TrendingUp}
          iconColor="text-green-500"
          trend={{ value: 8, direction: "up" }}
        />
        <KpiCard
          title="Duplicate Alerts"
          value={duplicateAlerts}
          subtitle={duplicateAlerts === 0 ? "All clear" : "Need review"}
          icon={AlertTriangle}
          iconColor={duplicateAlerts > 0 ? "text-amber-500" : "text-green-500"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Submissions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold">Recent Submissions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.DASHBOARD_CANDIDATES} className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentSubmissions.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No submissions yet. Invite vendors to start receiving candidates.
                </div>
              ) : (
                <div className="divide-y">
                  {recentSubmissions.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`${ROUTES.DASHBOARD_CANDIDATES}/${sub.id}`}
                      className="flex items-start gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
                        {(sub.profile.fullName[0] ?? "?").toUpperCase()}
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{sub.profile.fullName}</p>
                          <StatusBadge status={sub.status} type="submission" />
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {sub.profile.currentTitle} · via {sub.vendor.name}
                        </p>
                        {sub.profile.skills.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {sub.profile.skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(sub.submittedAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Plan Usage */}
          {subscription && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Plan Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-muted-foreground">Vendors</span>
                    <span className="text-sm font-semibold">
                      {approvedVendors}
                      {maxVendors !== -1 && ` / ${maxVendors}`}
                    </span>
                  </div>
                  {maxVendors !== -1 && (
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          vendorUsagePercent > 80 ? "bg-amber-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(vendorUsagePercent, 100)}%` }}
                      />
                    </div>
                  )}
                  {vendorUsagePercent > 80 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Approaching limit. Consider upgrading.
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <div>
                    <p className="text-sm font-medium">{subscription.plan.displayName} Plan</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {subscription.billingCycle.toLowerCase()} billing
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={ROUTES.DASHBOARD_BILLING}>Manage</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: ROUTES.DASHBOARD_VENDORS_INVITE, icon: Building2, label: "Invite a vendor" },
                { href: ROUTES.DASHBOARD_CANDIDATES, icon: UserCheck, label: "Review candidates" },
                { href: ROUTES.DASHBOARD_DUPLICATES, icon: AlertTriangle, label: "Review duplicates", badge: duplicateAlerts },
                { href: ROUTES.DASHBOARD_SETTINGS_BRANDING, icon: Users, label: "Update branding" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{action.label}</span>
                  {action.badge ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                      {action.badge}
                    </span>
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "morning"
  if (hour < 18) return "afternoon"
  return "evening"
}
