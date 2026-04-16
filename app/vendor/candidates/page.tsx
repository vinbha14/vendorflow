// app/vendor/candidates/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { UserCheck, Plus, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "My Candidates" }

export default async function VendorCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id, isActive: true },
  })
  if (!vendorUser) redirect(ROUTES.SIGN_IN)

  const statusFilter = params.status as string | undefined

  const submissions = await prisma.candidateSubmission.findMany({
    where: {
      vendorId: vendorUser.vendorId,
      ...(statusFilter && { status: statusFilter as any }),
    },
    orderBy: { submittedAt: "desc" },
    include: {
      profile: {
        select: {
          fullName: true,
          currentTitle: true,
          skills: true,
          experienceYears: true,
          aiSummary: { select: { fitScore: true, status: true } },
        },
      },
      company: {
        select: {
          name: true,
          logoUrl: true,
          branding: { select: { primaryColor: true } },
        },
      },
    },
  })

  const statusCounts = await prisma.candidateSubmission.groupBy({
    by: ["status"],
    where: { vendorId: vendorUser.vendorId },
    _count: true,
  })
  const countMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]))

  const STATUS_TABS = [
    { label: "All", value: "" },
    { label: "Submitted", value: "SUBMITTED" },
    { label: "Under Review", value: "UNDER_REVIEW" },
    { label: "Shortlisted", value: "SHORTLISTED" },
    { label: "Interview", value: "INTERVIEW" },
    { label: "Hired", value: "HIRED" },
    { label: "Rejected", value: "REJECTED" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Candidates"
        description={`${submissions.length} submission${submissions.length !== 1 ? "s" : ""}`}
        actions={
          <Button asChild>
            <Link href={ROUTES.VENDOR_CANDIDATES_NEW}>
              <Plus className="h-4 w-4" />
              Submit new
            </Link>
          </Button>
        }
      />

      {/* Status tabs */}
      <div className="flex gap-1 border-b overflow-x-auto no-scrollbar">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value || (!statusFilter && tab.value === "")
          const count = tab.value ? countMap[tab.value] : undefined
          return (
            <Link
              key={tab.value}
              href={`${ROUTES.VENDOR_CANDIDATES}${tab.value ? `?status=${tab.value}` : ""}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count !== undefined && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${isActive ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No candidates yet"
              description="Submit your first candidate profile to get started."
              action={{ label: "Submit a candidate", href: ROUTES.VENDOR_CANDIDATES_NEW }}
            />
          ) : (
            <div className="divide-y">
              {submissions.map((sub) => {
                const primaryColor = sub.company.branding?.primaryColor ?? "#4F46E5"
                const fitScore = sub.profile.aiSummary?.fitScore

                return (
                  <Link
                    key={sub.id}
                    href={`${ROUTES.VENDOR_CANDIDATES}/${sub.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Candidate avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                      {(sub.profile.fullName[0] ?? "?").toUpperCase()}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{sub.profile.fullName}</p>
                        <StatusBadge status={sub.status} type="submission" />
                        {fitScore !== null && fitScore !== undefined && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Sparkles className="h-3 w-3 text-violet-500" />
                            {fitScore}/100
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {sub.profile.currentTitle}
                        {sub.profile.experienceYears ? ` · ${sub.profile.experienceYears}y exp` : ""}
                      </p>
                      {sub.profile.skills.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {sub.profile.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="text-[10px] bg-secondary rounded-full px-2 py-0.5 text-muted-foreground">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Company + date */}
                    <div className="shrink-0 text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        {sub.company.logoUrl ? (
                          <img src={sub.company.logoUrl} alt={sub.company.name} className="h-5 w-5 rounded object-contain border bg-white" />
                        ) : (
                          <div
                            className="h-5 w-5 rounded flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {sub.company.name[0]}
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">{sub.company.name}</span>
                      </div>
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
    </div>
  )
}
