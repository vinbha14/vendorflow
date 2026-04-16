// app/admin/ai-usage/page.tsx
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, DollarSign, Zap, TrendingUp } from "lucide-react"
import { formatDate } from "@/lib/utils"

export const metadata = { title: "AI Usage — Admin" }

export default async function AdminAiUsagePage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalStats,
    recentStats,
    weeklyStats,
    byStatus,
    recentSummaries,
    duplicateStats,
  ] = await Promise.all([
    // All time
    prisma.aiSummary.aggregate({
      where: { status: "COMPLETED" },
      _count: true,
      _sum: { promptTokens: true, completionTokens: true, totalCost: true },
    }),
    // Last 30 days
    prisma.aiSummary.aggregate({
      where: { status: "COMPLETED", generatedAt: { gte: thirtyDaysAgo } },
      _count: true,
      _sum: { promptTokens: true, completionTokens: true, totalCost: true },
    }),
    // Last 7 days
    prisma.aiSummary.aggregate({
      where: { status: "COMPLETED", generatedAt: { gte: sevenDaysAgo } },
      _count: true,
      _sum: { totalCost: true },
    }),
    // By status
    prisma.aiSummary.groupBy({ by: ["status"], _count: true }),
    // Recent summaries
    prisma.aiSummary.findMany({
      where: { status: "COMPLETED" },
      orderBy: { generatedAt: "desc" },
      take: 10,
      include: {
        profile: {
          select: {
            fullName: true,
            submissions: {
              select: { company: { select: { name: true } } },
              take: 1,
            },
          },
        },
      },
    }),
    // Duplicate detection stats
    prisma.duplicateAlert.groupBy({ by: ["severity", "status"], _count: true }),
  ])

  const totalCostAllTime = totalStats._sum.totalCost ?? 0
  const totalCost30d = recentStats._sum.totalCost ?? 0
  const totalCost7d = weeklyStats._sum.totalCost ?? 0
  const totalSummaries = totalStats._count
  const summaries30d = recentStats._count
  const totalTokens30d = (recentStats._sum.promptTokens ?? 0) + (recentStats._sum.completionTokens ?? 0)

  const failedCount = byStatus.find((s) => s.status === "FAILED")?._count ?? 0
  const pendingCount = byStatus.find((s) => s.status === "PENDING")?._count ?? 0

  const totalDuplicates = duplicateStats.reduce((sum, d) => sum + d._count, 0)
  const openDuplicates = duplicateStats.filter((d) => d.status === "OPEN").reduce((sum, d) => sum + d._count, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Usage &amp; Costs"
        description="Token consumption, cost tracking, and AI pipeline performance across the platform."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="CV Summaries (all time)" value={totalSummaries.toLocaleString()} subtitle={`$${totalCostAllTime.toFixed(2)} total cost`} icon={Brain} iconColor="text-violet-500" />
        <KpiCard title="Summaries (30d)" value={summaries30d.toLocaleString()} subtitle={`$${totalCost30d.toFixed(2)} this month`} icon={TrendingUp} iconColor="text-blue-500" trend={{ value: 15, direction: "up" }} />
        <KpiCard title="AI Cost (7d)" value={`$${totalCost7d.toFixed(2)}`} subtitle={`${(totalCost7d / 7).toFixed(3)}/day avg`} icon={DollarSign} iconColor="text-green-500" />
        <KpiCard title="Duplicate Alerts" value={totalDuplicates.toLocaleString()} subtitle={`${openDuplicates} open`} icon={Zap} iconColor="text-amber-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Token breakdown */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Token usage (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Prompt tokens", value: (recentStats._sum.promptTokens ?? 0).toLocaleString(), sub: "Input to GPT-4o" },
              { label: "Completion tokens", value: (recentStats._sum.completionTokens ?? 0).toLocaleString(), sub: "GPT-4o output" },
              { label: "Total tokens", value: totalTokens30d.toLocaleString(), sub: "Combined usage" },
              { label: "Avg tokens/summary", value: summaries30d > 0 ? Math.round(totalTokens30d / summaries30d).toLocaleString() : "—", sub: "Efficiency metric" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <p className="font-mono text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pipeline health */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Pipeline health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {byStatus.map((s) => {
              const colors: Record<string, string> = {
                COMPLETED: "text-green-600", FAILED: "text-red-600",
                PENDING: "text-amber-600", PROCESSING: "text-blue-600",
              }
              return (
                <div key={s.status} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${colors[s.status] ?? "text-foreground"}`}>
                      {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold">{s._count.toLocaleString()}</span>
                </div>
              )
            })}
            {failedCount > 0 && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                ⚠️ {failedCount} failed summaries need attention.
                Check job logs for error details.
              </p>
            )}
            {pendingCount > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                {pendingCount} summaries queued. Background jobs processing.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent AI summaries */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Recent AI summaries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {recentSummaries.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center text-sm">
                <div className="col-span-3 font-medium truncate">{s.profile.fullName}</div>
                <div className="col-span-3 text-muted-foreground truncate">
                  {s.profile.submissions[0]?.company.name ?? "—"}
                </div>
                <div className="col-span-2 font-mono text-muted-foreground">
                  {s.model ?? "gpt-4o"}
                </div>
                <div className="col-span-2 text-right font-mono">
                  {s.fitScore !== null ? (
                    <span className={s.fitScore >= 80 ? "text-green-600" : s.fitScore >= 60 ? "text-amber-600" : "text-red-600"}>
                      {s.fitScore}/100
                    </span>
                  ) : "—"}
                </div>
                <div className="col-span-1 text-right font-mono text-muted-foreground text-xs">
                  ${(s.totalCost ?? 0).toFixed(4)}
                </div>
                <div className="col-span-1 text-right text-xs text-muted-foreground">
                  {s.generatedAt ? formatDate(s.generatedAt) : "—"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
