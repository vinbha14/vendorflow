// app/dashboard/analytics/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, Star, Trophy } from "lucide-react"
import { formatDate } from "@/lib/utils"

export const metadata = { title: "Analytics" }

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    submissionsByStatus,
    submissionsThisMonth,
    vendorLeaderboard,
    aiStats,
    duplicateStats,
    recentHires,
  ] = await Promise.all([
    // Overall funnel
    prisma.candidateSubmission.groupBy({
      by: ["status"],
      where: { companyId: tenantId },
      _count: true,
    }),
    // This month's submissions
    prisma.candidateSubmission.count({
      where: { companyId: tenantId, submittedAt: { gte: thirtyDaysAgo } },
    }),
    // Vendor performance leaderboard
    prisma.vendorCompany.findMany({
      where: { companyId: tenantId, status: "APPROVED" },
      include: {
        vendor: { select: { name: true, logoUrl: true } },
      },
      orderBy: { acceptedCount: "desc" },
      take: 10,
    }),
    // AI summaries generated
    prisma.aiSummary.count({
      where: {
        status: "COMPLETED",
        profile: { submissions: { some: { companyId: tenantId } } },
      },
    }),
    // Duplicate alerts
    prisma.duplicateAlert.count({ where: { companyId: tenantId } }),
    // Recent hires
    prisma.candidateSubmission.findMany({
      where: { companyId: tenantId, status: "HIRED" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        profile: { select: { fullName: true, currentTitle: true } },
        vendor: { select: { name: true } },
      },
    }),
  ])

  const totalSubmissions = submissionsByStatus.reduce((sum, s) => sum + s._count, 0)
  const shortlisted = submissionsByStatus.find((s) => s.status === "SHORTLISTED")?._count ?? 0
  const interviewed = submissionsByStatus.find((s) => s.status === "INTERVIEW")?._count ?? 0
  const hired = submissionsByStatus.find((s) => s.status === "HIRED")?._count ?? 0
  const rejected = submissionsByStatus.find((s) => s.status === "REJECTED")?._count ?? 0

  const shortlistRate = totalSubmissions > 0 ? Math.round((shortlisted / totalSubmissions) * 100) : 0
  const hireRate = totalSubmissions > 0 ? Math.round((hired / totalSubmissions) * 100) : 0

  const funnelStages = [
    { label: "Submitted", count: totalSubmissions, color: "bg-blue-500" },
    { label: "Under Review", count: submissionsByStatus.find(s => s.status === "UNDER_REVIEW")?._count ?? 0, color: "bg-amber-500" },
    { label: "Shortlisted", count: shortlisted, color: "bg-purple-500" },
    { label: "Interview", count: interviewed, color: "bg-indigo-500" },
    { label: "Hired", count: hired, color: "bg-green-500" },
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" description="Hiring funnel, vendor performance, and AI insights." />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Submissions" value={totalSubmissions.toLocaleString()} subtitle={`${submissionsThisMonth} this month`} icon={BarChart3} iconColor="text-blue-500" />
        <KpiCard title="Shortlist Rate" value={`${shortlistRate}%`} subtitle={`${shortlisted} shortlisted`} icon={TrendingUp} iconColor="text-purple-500" />
        <KpiCard title="Hire Rate" value={`${hireRate}%`} subtitle={`${hired} total hires`} icon={Trophy} iconColor="text-green-500" />
        <KpiCard title="AI Summaries" value={aiStats.toLocaleString()} subtitle={`${duplicateStats} duplicates caught`} icon={Users} iconColor="text-violet-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hiring funnel */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Hiring funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelStages.map((stage) => {
              const pct = totalSubmissions > 0 ? (stage.count / totalSubmissions) * 100 : 0
              return (
                <div key={stage.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-muted-foreground">{stage.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{stage.count}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(pct)}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stage.color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {rejected > 0 && (
              <div className="pt-2 border-t text-xs text-muted-foreground flex items-center justify-between">
                <span>Rejected</span>
                <span>{rejected} ({totalSubmissions > 0 ? Math.round((rejected / totalSubmissions) * 100) : 0}%)</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor leaderboard */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Vendor performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {vendorLeaderboard.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground text-center">No vendor data yet.</p>
            ) : (
              <div className="divide-y">
                {vendorLeaderboard.map((vc, i) => {
                  const successRate = vc.submissionsCount > 0
                    ? Math.round((vc.acceptedCount / vc.submissionsCount) * 100) : 0
                  return (
                    <div key={vc.id} className="flex items-center gap-4 px-6 py-3.5">
                      <span className={`text-sm font-bold w-5 ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{vc.vendor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {vc.submissionsCount} submitted · {vc.acceptedCount} accepted
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${successRate >= 30 ? "text-green-600" : successRate >= 15 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {successRate}%
                        </p>
                        {vc.rating !== null && (
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs">{vc.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent hires */}
      {recentHires.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-green-500" />
              Recent hires
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentHires.map((sub) => (
                <div key={sub.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700 text-sm font-bold shrink-0">
                    {(sub.profile.fullName[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{sub.profile.fullName}</p>
                    <p className="text-xs text-muted-foreground">{sub.profile.currentTitle} · via {sub.vendor.name}</p>
                  </div>
                  <Badge variant="green" className="text-xs">Hired</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
