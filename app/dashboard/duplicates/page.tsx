// app/dashboard/duplicates/page.tsx
// Full duplicate review queue.
// Company admins and hiring managers both land here.
// Shows: summary stats → alert list grouped by severity → reviewed history.

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { KpiCard } from "@/components/shared/kpi-card"
import { DuplicateAlertCard } from "@/components/candidates/duplicate-alert-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2, AlertTriangle, Shield, Sparkles,
  BarChart3, Clock, GitMerge, XCircle, EyeOff,
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export const metadata = { title: "Duplicate Detection" }

// ─── Prisma select shape for alert cards ─────────────────────────────────────
const alertSelect = {
  id: true,
  severity: true,
  confidenceScore: true,
  riskLevel: true,
  matchedFields: true,
  matchReason: true,
  detectionLayer: true,
  recommendation: true,
  rawSignals: true,
  detectedAt: true,
  profileA: {
    select: {
      id: true, fullName: true, currentTitle: true, currentCompany: true,
      skills: true, email: true, phone: true, experienceYears: true,
      location: true, highestDegree: true, university: true, graduationYear: true,
      vendor: { select: { name: true } },
    },
  },
  profileB: {
    select: {
      id: true, fullName: true, currentTitle: true, currentCompany: true,
      skills: true, email: true, phone: true, experienceYears: true,
      location: true, highestDegree: true, university: true, graduationYear: true,
      vendor: { select: { name: true } },
    },
  },
  reviews: {
    orderBy: { reviewedAt: "desc" as const },
    take: 1,
    include: { reviewer: { select: { name: true } } },
  },
} as const

export default async function DuplicatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; risk?: string }>
}) {
  const params = await searchParams
  const tab = params.tab ?? "open"
  const riskFilter = params.risk ?? ""

  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  // ── Parallel data fetching ─────────────────────────────────────────────────
  const [openAlerts, reviewedAlerts, stats] = await Promise.all([
    // Open alerts
    prisma.duplicateAlert.findMany({
      where: {
        companyId: tenantId,
        status: "OPEN",
        ...(riskFilter && { riskLevel: riskFilter }),
      },
      orderBy: [
        // HIGH_CONFIDENCE first, then LIKELY, then POSSIBLE
        { severity: "desc" },
        { confidenceScore: "desc" },
      ],
      select: alertSelect,
    }),

    // Recently reviewed alerts (last 30)
    tab === "history"
      ? prisma.duplicateAlert.findMany({
          where: { companyId: tenantId, status: "REVIEWED" },
          orderBy: { updatedAt: "desc" },
          take: 30,
          select: {
            ...alertSelect,
            reviews: {
              orderBy: { reviewedAt: "desc" as const },
              take: 1,
              include: { reviewer: { select: { name: true } } },
            },
          },
        })
      : Promise.resolve([]),

    // Stats
    Promise.all([
      prisma.duplicateAlert.count({ where: { companyId: tenantId, status: "OPEN" } }),
      prisma.duplicateAlert.count({ where: { companyId: tenantId, status: "OPEN", severity: "HIGH_CONFIDENCE" } }),
      prisma.duplicateAlert.count({ where: { companyId: tenantId, status: "REVIEWED" } }),
      prisma.duplicateAlert.count({ where: { companyId: tenantId, status: "REVIEWED" } }),
      // Reviews by decision
      prisma.duplicateReview.groupBy({
        by: ["decision"],
        where: { alert: { companyId: tenantId } },
        _count: true,
      }),
    ]).then(([totalOpen, highConf, reviewed, dismissed, byDecision]) => ({
      totalOpen,
      highConf,
      reviewed,
      dismissed,
      byDecision,
    })),
  ])

  const highConfidence = openAlerts.filter((a) => a.severity === "HIGH_CONFIDENCE")
  const likely        = openAlerts.filter((a) => a.severity === "LIKELY")
  const possible      = openAlerts.filter((a) => a.severity === "POSSIBLE")

  const confirmedCount  = stats.byDecision.find((d) => d.decision === "CONFIRMED_DUPLICATE")?._count ?? 0
  const mergeCount      = stats.byDecision.find((d) => d.decision === "MERGE_REQUESTED")?._count  ?? 0
  const notDupCount     = stats.byDecision.find((d) => d.decision === "NOT_DUPLICATE")?._count    ?? 0
  const ignoredCount    = stats.byDecision.find((d) => d.decision === "IGNORED")?._count          ?? 0

  const RISK_TABS = [
    { value: "",       label: "All risk levels",    count: openAlerts.length },
    { value: "high",   label: "High risk",          count: openAlerts.filter((a) => a.riskLevel === "high").length },
    { value: "medium", label: "Medium risk",        count: openAlerts.filter((a) => a.riskLevel === "medium").length },
    { value: "low",    label: "Low risk",           count: openAlerts.filter((a) => a.riskLevel === "low").length },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Duplicate Detection"
        description="AI-powered hybrid scoring engine flags candidates submitted multiple times across vendors."
        actions={
          <div className="flex items-center gap-2">
            {stats.totalOpen > 0 && (
              <Badge variant="warning" className="gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                {stats.totalOpen} open
              </Badge>
            )}
            <Badge variant="gray" className="gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              {stats.reviewed} reviewed
            </Badge>
          </div>
        }
      />

      {/* ── Stats cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Open alerts"
          value={stats.totalOpen}
          subtitle={stats.highConf > 0 ? `${stats.highConf} high confidence` : "None critical"}
          icon={AlertTriangle}
          iconColor={stats.highConf > 0 ? "text-red-500" : "text-amber-500"}
        />
        <KpiCard
          title="Confirmed duplicates"
          value={confirmedCount}
          subtitle="Same person, different vendors"
          icon={Shield}
          iconColor="text-red-500"
        />
        <KpiCard
          title="Merge requests"
          value={mergeCount}
          subtitle="Profiles merged"
          icon={GitMerge}
          iconColor="text-violet-500"
        />
        <KpiCard
          title="Cleared as distinct"
          value={notDupCount + ignoredCount}
          subtitle={`${notDupCount} confirmed distinct · ${ignoredCount} dismissed`}
          icon={CheckCircle2}
          iconColor="text-green-500"
        />
      </div>

      {/* ── How it works callout ── */}
      {stats.totalOpen === 0 && stats.reviewed === 0 && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="py-6 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">How duplicate detection works</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every new candidate submission is scored against all existing profiles in your workspace
                using a 10-signal hybrid engine: exact email/phone match, name fuzzy similarity,
                company and experience comparison, skills overlap, education, location, and resume
                embedding cosine similarity. Alerts appear here when the confidence score exceeds 45/100.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  "Email exact match",
                  "Phone normalised match",
                  "Name fuzzy (Levenshtein)",
                  "Company similarity",
                  "Experience years",
                  "Skills overlap (Jaccard)",
                  "Education overlap",
                  "Location match",
                  "Employment history",
                  "Resume embedding (GPT)",
                ].map((signal) => (
                  <span key={signal} className="rounded-full border bg-background px-2.5 py-0.5 text-[10px] text-muted-foreground">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tab bar: Open / History ── */}
      <div className="flex border-b">
        {[
          { id: "open",    label: "Review queue",  count: stats.totalOpen },
          { id: "history", label: "Reviewed",       count: stats.reviewed },
        ].map(({ id, label, count }) => {
          const isActive = tab === id
          return (
            <Link
              key={id}
              href={`${ROUTES.DASHBOARD_DUPLICATES}?tab=${id}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                isActive ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
              }`}>
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* ── OPEN TAB ── */}
      {tab === "open" && (
        <div className="space-y-6">
          {/* Risk filter */}
          {openAlerts.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {RISK_TABS.map(({ value, label, count }) => (
                <Link
                  key={value}
                  href={`${ROUTES.DASHBOARD_DUPLICATES}?tab=open${value ? `&risk=${value}` : ""}`}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                    riskFilter === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                  }`}
                >
                  {label} ({count})
                </Link>
              ))}
            </div>
          )}

          {openAlerts.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Queue is clear"
              description={
                riskFilter
                  ? `No ${riskFilter}-risk alerts open. Try a different filter.`
                  : "No duplicate alerts in the queue. Every candidate submission has been checked and passed."
              }
              size="lg"
            />
          ) : (
            <div className="space-y-10">
              {/* High confidence */}
              {highConfidence.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="text-sm font-bold">High confidence duplicates</h2>
                    <Badge variant="red">{highConfidence.length}</Badge>
                    <p className="text-xs text-muted-foreground ml-1">Score ≥ 90 · very likely the same person</p>
                  </div>
                  <div className="space-y-4">
                    {highConfidence.map((alert) => (
                      <DuplicateAlertCard key={alert.id} alert={alert as any} />
                    ))}
                  </div>
                </section>
              )}

              {/* Likely */}
              {likely.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                    <h2 className="text-sm font-bold">Likely duplicates</h2>
                    <Badge variant="orange">{likely.length}</Badge>
                    <p className="text-xs text-muted-foreground ml-1">Score 70–89 · probable duplicate</p>
                  </div>
                  <div className="space-y-4">
                    {likely.map((alert) => (
                      <DuplicateAlertCard key={alert.id} alert={alert as any} />
                    ))}
                  </div>
                </section>
              )}

              {/* Possible */}
              {possible.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <h2 className="text-sm font-bold">Possible duplicates</h2>
                    <Badge variant="amber">{possible.length}</Badge>
                    <p className="text-xs text-muted-foreground ml-1">Score 45–69 · worth reviewing</p>
                  </div>
                  <div className="space-y-4">
                    {possible.map((alert) => (
                      <DuplicateAlertCard key={alert.id} alert={alert as any} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div className="space-y-4">
          {reviewedAlerts.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No review history yet"
              description="Reviewed alerts will appear here. Work through the open queue to build history."
              size="sm"
            />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Review history ({reviewedAlerts.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Column header */}
                <div className="grid grid-cols-12 gap-3 px-6 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b bg-secondary/30">
                  <span className="col-span-4">Profiles</span>
                  <span className="col-span-2">Score</span>
                  <span className="col-span-2">Decision</span>
                  <span className="col-span-2">Reviewer</span>
                  <span className="col-span-2">Date</span>
                </div>
                <div className="divide-y">
                  {reviewedAlerts.map((alert) => {
                    const review = alert.reviews[0]
                    const decision = review?.decision ?? "UNKNOWN"
                    const DECISION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
                      CONFIRMED_DUPLICATE: AlertTriangle,
                      NOT_DUPLICATE: XCircle,
                      MERGE_REQUESTED: GitMerge,
                      IGNORED: EyeOff,
                    }
                    const DECISION_COLORS: Record<string, string> = {
                      CONFIRMED_DUPLICATE: "text-red-600",
                      NOT_DUPLICATE: "text-green-600",
                      MERGE_REQUESTED: "text-violet-600",
                      IGNORED: "text-muted-foreground",
                    }
                    const DecisionIcon = DECISION_ICONS[decision] ?? CheckCircle2
                    const score = Math.round(alert.confidenceScore)

                    return (
                      <div key={alert.id} className="grid grid-cols-12 gap-3 px-6 py-3.5 items-center text-sm hover:bg-muted/20 transition-colors">
                        <div className="col-span-4 min-w-0">
                          <p className="text-sm font-medium truncate">{alert.profileA.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">↔ {alert.profileB.fullName}</p>
                        </div>
                        <div className="col-span-2">
                          <span className={`text-sm font-bold tabular-nums ${
                            score >= 90 ? "text-red-600" : score >= 70 ? "text-orange-600" : "text-amber-600"
                          }`}>
                            {score}
                          </span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                        <div className="col-span-2">
                          <div className={`flex items-center gap-1.5 text-xs font-medium ${DECISION_COLORS[decision]}`}>
                            <DecisionIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {DECISION_LABELS[decision] ?? decision.replace("_", " ").toLowerCase()}
                            </span>
                          </div>
                          {review?.notes && (
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5" title={review.notes}>
                              "{review.notes}"
                            </p>
                          )}
                        </div>
                        <div className="col-span-2 text-xs text-muted-foreground truncate">
                          {review?.reviewer.name ?? "—"}
                        </div>
                        <div className="col-span-2 text-xs text-muted-foreground">
                          {review?.reviewedAt ? formatDate(new Date(review.reviewedAt)) : "—"}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

const DECISION_LABELS: Record<string, string> = {
  CONFIRMED_DUPLICATE: "Confirmed duplicate",
  NOT_DUPLICATE:       "Not a duplicate",
  MERGE_REQUESTED:     "Merge requested",
  IGNORED:             "Dismissed",
}
