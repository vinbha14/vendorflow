// app/dashboard/candidates/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ROUTES, SUBMISSION_STATUS_LABELS } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { UserCheck, AlertTriangle, Sparkles, ArrowRight, Search } from "lucide-react"
import Link from "next/link"
import type { CandidateSubmissionStatus } from "@prisma/client"

export const metadata = { title: "Candidates" }

const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Under review", value: "UNDER_REVIEW" },
  { label: "Shortlisted", value: "SHORTLISTED" },
  { label: "Interview", value: "INTERVIEW" },
  { label: "Hired", value: "HIRED" },
  { label: "Rejected", value: "REJECTED" },
]

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; vendor?: string; page?: string }>
}) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  const statusFilter = params.status as CandidateSubmissionStatus | undefined
  const search = params.q ?? ""
  const vendorFilter = params.vendor ?? ""
  const page = parseInt(params.page ?? "1", 10)
  const pageSize = 20

  const where = {
    companyId: tenantId,
    ...(statusFilter && { status: statusFilter }),
    ...(vendorFilter && { vendorId: vendorFilter }),
    ...(search && {
      profile: {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { currentTitle: { contains: search, mode: "insensitive" as const } },
          { currentCompany: { contains: search, mode: "insensitive" as const } },
        ],
      },
    }),
  }

  const [submissions, total, vendorList, statusCounts] = await Promise.all([
    prisma.candidateSubmission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        profile: {
          select: {
            fullName: true,
            currentTitle: true,
            currentCompany: true,
            skills: true,
            location: true,
            experienceYears: true,
            aiSummary: { select: { fitScore: true, status: true, recommendationDecision: true } },
          },
        },
        vendor: { select: { name: true } },
      },
    }),
    prisma.candidateSubmission.count({ where }),
    // Vendor filter options
    prisma.vendorCompany.findMany({
      where: { companyId: tenantId, status: "APPROVED" },
      include: { vendor: { select: { id: true, name: true } } },
    }),
    // Count per status
    prisma.candidateSubmission.groupBy({
      by: ["status"],
      where: { companyId: tenantId },
      _count: true,
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const statusCountMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        description={`${total} total submissions`}
      />

      {/* Status tab bar */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b pb-0 -mb-px">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value || (!statusFilter && tab.value === "")
          const count = tab.value ? statusCountMap[tab.value] : undefined
          return (
            <Link
              key={tab.value}
              href={`${ROUTES.DASHBOARD_CANDIDATES}${tab.value ? `?status=${tab.value}` : ""}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count !== undefined && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                  isActive ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        <form className="flex-1 relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search candidates..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </form>
        {vendorList.length > 1 && (
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All vendors</option>
            {vendorList.map((vc) => (
              <option key={vc.vendor.id} value={vc.vendor.id}>{vc.vendor.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Candidate list */}
      <Card>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No candidates found"
              description={
                statusFilter
                  ? `No candidates with status "${SUBMISSION_STATUS_LABELS[statusFilter]}".`
                  : "No candidates submitted yet. Invite vendors to start receiving profiles."
              }
              action={
                !statusFilter
                  ? { label: "Invite vendors", href: ROUTES.DASHBOARD_VENDORS_INVITE }
                  : undefined
              }
            />
          ) : (
            <div className="divide-y">
              {submissions.map((sub) => {
                const fitScore = sub.profile.aiSummary?.fitScore
                const recDecision = sub.profile.aiSummary?.recommendationDecision
                const REC_COLORS: Record<string, string> = {
                  SHORTLIST: "text-green-700 bg-green-50 border-green-200",
                  REVIEW:    "text-blue-700 bg-blue-50 border-blue-200",
                  HOLD:      "text-amber-700 bg-amber-50 border-amber-200",
                  REJECT:    "text-red-700 bg-red-50 border-red-200",
                }
                const hasDuplicateAlert = false // would come from a join in real implementation

                return (
                  <Link
                    key={sub.id}
                    href={`${ROUTES.DASHBOARD_CANDIDATES}/${sub.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
                      {(sub.profile.fullName[0] ?? "?").toUpperCase()}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{sub.profile.fullName}</p>
                        <StatusBadge status={sub.status} type="submission" />
                        {hasDuplicateAlert && (
                          <Badge variant="warning" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            Duplicate alert
                          </Badge>
                        )}
                        {recDecision ? (
                          <span className={`text-[10px] font-semibold rounded-full px-2.5 py-0.5 border ${REC_COLORS[recDecision] ?? "bg-secondary text-muted-foreground border-border"}`}>
                            {recDecision.charAt(0) + recDecision.slice(1).toLowerCase()}
                          </span>
                        ) : sub.profile.aiSummary?.status === "COMPLETED" && (
                          <Badge variant="purple" className="gap-1 text-xs">
                            <Sparkles className="h-3 w-3" />
                            AI summary
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {sub.profile.currentTitle}
                        {sub.profile.currentCompany ? ` · ${sub.profile.currentCompany}` : ""}
                        {sub.profile.experienceYears ? ` · ${sub.profile.experienceYears}y exp` : ""}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">via {sub.vendor.name}</span>
                        {sub.profile.location && (
                          <span className="text-xs text-muted-foreground">{sub.profile.location}</span>
                        )}
                        {sub.profile.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="text-[10px] bg-secondary rounded-full px-2 py-0.5 text-muted-foreground hidden sm:inline-block">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: fit score + date */}
                    <div className="text-right shrink-0 space-y-1">
                      {fitScore !== null && fitScore !== undefined ? (
                        <div className={`text-lg font-bold ${fitScore >= 80 ? "text-green-600" : fitScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                          {fitScore}
                          <span className="text-xs font-normal text-muted-foreground">/100</span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">AI pending</div>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDate(sub.submittedAt)}</p>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`${ROUTES.DASHBOARD_CANDIDATES}?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}>
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`${ROUTES.DASHBOARD_CANDIDATES}?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
