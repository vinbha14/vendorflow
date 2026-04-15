// app/vendor/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { KpiCard } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDate } from "@/lib/utils"
import { UserCheck, Building2, TrendingUp, Plus, ArrowRight, FileText } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Vendor Dashboard" }

export default async function VendorDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: {
      vendor: {
        include: {
          companyRelationships: {
            where: { status: "APPROVED" },
            include: {
              company: {
                select: {
                  id: true, name: true, logoUrl: true, country: true,
                  branding: { select: { primaryColor: true, tagline: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!vendorUser) redirect(ROUTES.SIGN_IN)

  const vendorId = vendorUser.vendorId

  // Stats
  const [totalSubmissions, submissionsByStatus, recentSubmissions] = await Promise.all([
    prisma.candidateSubmission.count({ where: { vendorId } }),
    prisma.candidateSubmission.groupBy({
      by: ["status"],
      where: { vendorId },
      _count: true,
    }),
    prisma.candidateSubmission.findMany({
      where: { vendorId },
      orderBy: { submittedAt: "desc" },
      take: 6,
      include: {
        profile: { select: { fullName: true, currentTitle: true, skills: true } },
        company: { select: { name: true, logoUrl: true, branding: { select: { primaryColor: true } } } },
      },
    }),
  ])

  const shortlisted = submissionsByStatus.find((s) => s.status === "SHORTLISTED")?._count ?? 0
  const hired = submissionsByStatus.find((s) => s.status === "HIRED")?._count ?? 0
  const underReview = submissionsByStatus.find((s) => s.status === "UNDER_REVIEW")?._count ?? 0
  const assignedCompanies = vendorUser.vendor.companyRelationships

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vendor Dashboard"
        description={`Welcome back, ${session.user.name?.split(" ")[0] ?? "there"}`}
        actions={
          <Button asChild>
            <Link href={ROUTES.VENDOR_CANDIDATES_NEW}>
              <Plus className="h-4 w-4" />
              Submit candidate
            </Link>
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Assigned Companies"
          value={assignedCompanies.length}
          subtitle="Active relationships"
          icon={Building2}
          iconColor="text-blue-500"
        />
        <KpiCard
          title="Total Submitted"
          value={totalSubmissions}
          subtitle="All time"
          icon={UserCheck}
          iconColor="text-purple-500"
        />
        <KpiCard
          title="Shortlisted"
          value={shortlisted}
          subtitle={`${hired} hired total`}
          icon={TrendingUp}
          iconColor="text-green-500"
          trend={shortlisted > 0 ? { value: Math.round((shortlisted / Math.max(totalSubmissions, 1)) * 100), direction: "up" } : undefined}
        />
        <KpiCard
          title="Under Review"
          value={underReview}
          subtitle="Awaiting decision"
          icon={FileText}
          iconColor="text-amber-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent submissions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold">Recent Submissions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.VENDOR_CANDIDATES} className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentSubmissions.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="No submissions yet"
                  description="Submit your first candidate to get started."
                  action={{ label: "Submit candidate", href: ROUTES.VENDOR_CANDIDATES_NEW }}
                  size="sm"
                />
              ) : (
                <div className="divide-y">
                  {recentSubmissions.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`${ROUTES.VENDOR_CANDIDATES}/${sub.id}`}
                      className="flex items-start gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                        {(sub.profile.fullName[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{sub.profile.fullName}</p>
                          <StatusBadge status={sub.status} type="submission" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {sub.profile.currentTitle} · {sub.company.name}
                        </p>
                        {sub.profile.skills.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {sub.profile.skills.slice(0, 3).map((skill) => (
                              <span key={skill} className="text-[10px] bg-secondary rounded-full px-2 py-0.5 text-muted-foreground">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">{formatDate(sub.submittedAt)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assigned companies */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Assigned Companies</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {assignedCompanies.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No companies yet"
                  description="You'll appear here once a company approves you."
                  size="sm"
                />
              ) : (
                <div className="divide-y">
                  {assignedCompanies.map((vc) => (
                    <Link
                      key={vc.company.id}
                      href={`${ROUTES.VENDOR_COMPANIES}/${vc.company.id}`}
                      className="flex items-center gap-3 px-6 py-4 hover:bg-muted/50 transition-colors group"
                    >
                      {vc.company.logoUrl ? (
                        <img src={vc.company.logoUrl} alt={vc.company.name} className="h-9 w-9 rounded-lg object-contain border bg-white" />
                      ) : (
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold"
                          style={{ backgroundColor: vc.company.branding?.primaryColor ?? "#4F46E5" }}
                        >
                          {vc.company.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{vc.company.name}</p>
                        {vc.company.branding?.tagline && (
                          <p className="text-xs text-muted-foreground truncate">{vc.company.branding.tagline}</p>
                        )}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
