// app/vendor/companies/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { MapPin, Mail, Globe, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Company Portal" }

export default async function VendorCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id, isActive: true },
  })
  if (!vendorUser) redirect(ROUTES.SIGN_IN)

  const relationship = await prisma.vendorCompany.findUnique({
    where: { vendorId_companyId: { vendorId: vendorUser.vendorId, companyId: id } },
    include: {
      company: {
        include: {
          branding: true,
        },
      },
    },
  })

  if (!relationship) notFound()

  const { company } = relationship
  const branding = company.branding
  const primaryColor = branding?.primaryColor ?? "#4F46E5"
  const opportunities = (branding?.openOpportunities as Array<{ title: string; location: string; type: string; skills?: string[] }> | null) ?? []

  // Submissions to this company
  const submissions = await prisma.candidateSubmission.findMany({
    where: { vendorId: vendorUser.vendorId, companyId: id },
    orderBy: { submittedAt: "desc" },
    take: 10,
    include: {
      profile: { select: { fullName: true, currentTitle: true } },
    },
  })

  return (
    <div className="max-w-4xl space-y-8">
      {/* Company branded header */}
      <div className="rounded-xl overflow-hidden border">
        <div className="h-2" style={{ backgroundColor: primaryColor }} />
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-16 w-16 rounded-xl object-contain border bg-white p-1" />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl text-white text-2xl font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {company.name[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{company.name}</h1>
                <StatusBadge status={relationship.status} type="vendor" showDot />
              </div>
              {branding?.tagline && <p className="text-muted-foreground mt-1">{branding.tagline}</p>}
              <div className="flex items-center gap-4 mt-2">
                {company.country && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {[company.city, company.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {branding?.supportEmail && (
                  <a href={`mailto:${branding.supportEmail}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Mail className="h-3 w-3" />
                    {branding.supportEmail}
                  </a>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Globe className="h-3 w-3" />
                    Website
                  </a>
                )}
              </div>
            </div>
            {relationship.status === "APPROVED" && (
              <Button style={{ backgroundColor: primaryColor }} asChild>
                <Link href={ROUTES.VENDOR_CANDIDATES_NEW}>
                  <Plus className="h-4 w-4" />
                  Submit candidate
                </Link>
              </Button>
            )}
          </div>
          {branding?.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{branding.description}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Open opportunities */}
        {opportunities.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">
                Open roles ({opportunities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {opportunities.map((opp, i) => (
                <div key={i} className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{opp.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {opp.location}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">{opp.type}</Badge>
                      </div>
                    </div>
                    {relationship.status === "APPROVED" && (
                      <Button
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        style={{ backgroundColor: primaryColor }}
                        asChild
                      >
                        <Link href={`${ROUTES.VENDOR_CANDIDATES_NEW}?company=${id}&role=${encodeURIComponent(opp.title)}`}>
                          Submit
                        </Link>
                      </Button>
                    )}
                  </div>
                  {opp.skills && opp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {opp.skills.map((skill) => (
                        <span key={skill} className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Your submissions to this company */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Your submissions</CardTitle>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold">{relationship.submissionsCount}</p>
                  <p className="text-[10px] text-muted-foreground">Submitted</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{relationship.acceptedCount}</p>
                  <p className="text-[10px] text-muted-foreground">Accepted</p>
                </div>
                <div>
                  <p className="text-sm font-bold">
                    {relationship.submissionsCount > 0
                      ? `${Math.round((relationship.acceptedCount / relationship.submissionsCount) * 100)}%`
                      : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Rate</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {submissions.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No submissions to this company yet.
              </div>
            ) : (
              <div className="divide-y">
                {submissions.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`${ROUTES.VENDOR_CANDIDATES}/${sub.id}`}
                    className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold shrink-0">
                      {(sub.profile.fullName[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sub.profile.fullName}</p>
                      <p className="text-xs text-muted-foreground">{sub.profile.currentTitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={sub.status} type="submission" />
                      <p className="text-[10px] text-muted-foreground mt-1">{formatDate(sub.submittedAt)}</p>
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
  )
}
