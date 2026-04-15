// app/dashboard/hiring/page.tsx
// This is the Hiring Manager's primary view — focused entirely on the candidate queue,
// AI summaries, and shortlisting decisions. Company admins see the main /dashboard instead.

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { KpiCard } from "@/components/shared/kpi-card"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDate } from "@/lib/utils"
import {
  UserCheck, AlertTriangle, Sparkles, ArrowRight,
  Clock, Star, TrendingUp,
} from "lucide-react"
import Link from "next/link"

import { RECOMMENDATION_META, type RecommendationDecision } from "@/services/ai/cv-summary.service"

export default async function HiringManagerPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  // Verify this user is a hiring manager or admin
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: tenantId } },
  })
  if (!membership) redirect(ROUTES.SIGN_IN)

  const [
    submissionsForReview,
    submissionCounts,
    duplicateAlerts,
    recentActivity,
  ] = await Promise.all([
    // Candidates needing review — ordered by AI fit score desc
    prisma.candidateSubmission.findMany({
      where: {
        companyId: tenantId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
      orderBy: { submittedAt: "desc" },
      take: 15,
      include: {
        profile: {
          select: {
            fullName: true,
            currentTitle: true,
            currentCompany: true,
            skills: true,
            location: true,
            experienceYears: true,
            noticePeriodDays: true,
            aiSummary: {
              select: {
                status: true,
                fitScore: true,
                recommendationDecision: true,
                headlineSummary: true,
                executiveSummary: true,
                recommendedAction: true,
                keySkillsSummary: true,
              },
            },
          },
        },
        vendor: { select: { name: true } },
      },
    }),
    // Status counts
    prisma.candidateSubmission.groupBy({
      by: ["status"],
      where: { companyId: tenantId },
      _count: true,
    }),
    // Open duplicate alerts
    prisma.duplicateAlert.findMany({
      where: { companyId: tenantId, status: "OPEN" },
      orderBy: { confidenceScore: "desc" },
      take: 3,
      include: {
        profileA: { select: { fullName: true } },
        profileB: { select: { fullName: true } },
      },
    }),
    // Recently actioned
    prisma.candidateSubmission.findMany({
      where: {
        companyId: tenantId,
        reviewedBy: session.user.id,
        status: { in: ["SHORTLISTED", "REJECTED", "INTERVIEW"] },
      },
      orderBy: { reviewedAt: "desc" },
      take: 5,
      include: {
        profile: { select: { fullName: true, currentTitle: true } },
      },
    }),
  ])

  const toReview = submissionsForReview.length
  const shortlisted = submissionCounts.find((s) => s.status === "SHORTLISTED")?._count ?? 0
  const interview = submissionCounts.find((s) => s.status === "INTERVIEW")?._count ?? 0
  const hired = submissionCounts.find((s) => s.status === "HIRED")?._count ?? 0

  // Sort by AI fit score descending
  const sortedSubmissions = [...submissionsForReview].sort((a, b) => {
    const scoreA = a.profile.aiSummary?.fitScore ?? 0
    const scoreB = b.profile.aiSummary?.fitScore ?? 0
    return scoreB - scoreA
  })

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hiring Queue"
        description={`${toReview} candidate${toReview !== 1 ? "s" : ""} awaiting your review`}
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <KpiCard title="To review" value={toReview} subtitle="Need your attention" icon={Clock} iconColor="text-amber-500" />
        <KpiCard title="Shortlisted" value={shortlisted} subtitle="Awaiting interview" icon={Star} iconColor="text-purple-500" />
        <KpiCard title="In interview" value={interview} subtitle="Active rounds" icon={UserCheck} iconColor="text-blue-500" />
        <KpiCard title="Hired" value={hired} subtitle="This cycle" icon={TrendingUp} iconColor="text-green-500" />
      </div>

      {/* Duplicate alerts */}
      {duplicateAlerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">
                {duplicateAlerts.length} duplicate alert{duplicateAlerts.length !== 1 ? "s" : ""} need review
              </p>
            </div>
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 h-7 text-xs" asChild>
              <Link href={ROUTES.DASHBOARD_DUPLICATES}>Review all →</Link>
            </Button>
          </div>
          <div className="space-y-1">
            {duplicateAlerts.map((alert) => (
              <p key={alert.id} className="text-xs text-amber-700">
                · <strong>{alert.profileA.fullName}</strong> may be a duplicate of{" "}
                <strong>{alert.profileB.fullName}</strong>{" "}
                ({Math.round(alert.confidenceScore * 100)}% confidence)
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Main candidate queue with AI context */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Candidates to review</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.DASHBOARD_CANDIDATES} className="text-xs gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {sortedSubmissions.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="Queue is empty"
            description="All candidates have been reviewed. Great work!"
            size="sm"
          />
        ) : (
          <div className="space-y-3">
            {sortedSubmissions.map((sub) => {
              const summary = sub.profile.aiSummary
              const fitScore = summary?.fitScore
              const recommendation = summary?.recommendationDecision as string | null | undefined
              const fitColor =
                fitScore !== null && fitScore !== undefined
                  ? fitScore >= 80 ? "text-green-600" : fitScore >= 60 ? "text-amber-600" : "text-red-600"
                  : "text-muted-foreground"

              const REC_STYLES: Record<string, { label: string; color: string; bg: string }> = {
                SHORTLIST: { label: "Shortlist",  color: "text-green-700",  bg: "bg-green-50 border-green-200" },
                REVIEW:    { label: "Review",     color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
                HOLD:      { label: "Hold",       color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
                REJECT:    { label: "Reject",     color: "text-red-700",    bg: "bg-red-50 border-red-200" },
              }
              const recStyle = recommendation ? REC_STYLES[recommendation] : null

              return (
                <Link
                  key={sub.id}
                  href={`${ROUTES.DASHBOARD_CANDIDATES}/${sub.id}`}
                  className="block rounded-xl border bg-card hover:shadow-card-hover hover:border-primary/20 transition-all group"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-bold text-foreground">
                        {(sub.profile.fullName[0] ?? "?").toUpperCase()}
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{sub.profile.fullName}</p>
                          <StatusBadge status={sub.status} type="submission" />
                          {recStyle && (
                            <span className={`text-[10px] font-semibold rounded-full px-2.5 py-0.5 border ${recStyle.bg} ${recStyle.color}`}>
                              {recStyle.label}
                            </span>
                          )}
                          {summary?.status === "COMPLETED" && !recommendation && (
                            <Badge variant="purple" className="gap-1 text-[10px]">
                              <Sparkles className="h-2.5 w-2.5" />
                              AI summary ready
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {sub.profile.currentTitle}
                          {sub.profile.currentCompany ? ` · ${sub.profile.currentCompany}` : ""}
                          {sub.profile.experienceYears ? ` · ${sub.profile.experienceYears}y exp` : ""}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {sub.profile.location && <span>{sub.profile.location}</span>}
                          {sub.profile.noticePeriodDays !== null && (
                            <span>{sub.profile.noticePeriodDays}d notice</span>
                          )}
                          <span>via {sub.vendor.name}</span>
                        </div>

                        {/* AI headline or executive summary inline */}
                        {(summary?.headlineSummary || summary?.executiveSummary) && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                            {summary.headlineSummary ?? summary.executiveSummary}
                          </p>
                        )}

                        {/* Skills */}
                        {sub.profile.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sub.profile.skills.slice(0, 5).map((skill) => (
                              <span key={skill} className="text-[10px] bg-secondary rounded-full px-2 py-0.5">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right side: fit score + date */}
                      <div className="shrink-0 text-right space-y-2">
                        {fitScore !== null && fitScore !== undefined ? (
                          <div>
                            <p className={`text-2xl font-bold tabular-nums ${fitColor}`}>{fitScore}</p>
                            <p className="text-[10px] text-muted-foreground">AI fit</p>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">Analyzing…</div>
                        )}
                        <p className="text-xs text-muted-foreground">{formatDate(sub.submittedAt)}</p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                    </div>

                    {/* Recommended action from AI */}
                    {summary?.recommendedAction && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3" />
                          {summary.recommendedAction}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Recently actioned */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Recently actioned by you</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentActivity.map((sub) => (
                <Link
                  key={sub.id}
                  href={`${ROUTES.DASHBOARD_CANDIDATES}/${sub.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold shrink-0">
                    {(sub.profile.fullName[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{sub.profile.fullName}</p>
                    <p className="text-xs text-muted-foreground">{sub.profile.currentTitle}</p>
                  </div>
                  <StatusBadge status={sub.status} type="submission" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
