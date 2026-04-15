// app/dashboard/candidates/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { ROUTES, SUBMISSION_STATUS_LABELS } from "@/config/constants"
import { AiSummaryCard } from "@/components/candidates/ai-summary-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CandidateStatusActions } from "@/components/candidates/candidate-status-actions"
import { formatDate } from "@/lib/utils"
import {
  MapPin, Briefcase, GraduationCap, Clock, DollarSign,
  Globe, Linkedin, FileText, Building2, User, Download,
} from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Candidate Profile" }

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  // Fetch submission with all related data
  const submission = await prisma.candidateSubmission.findFirst({
    where: { id, companyId: tenantId },
    include: {
      profile: {
        include: {
          aiSummary: true,
          documents: true,
          notes: {
            include: { author: { select: { name: true, email: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      vendor: { select: { name: true, logoUrl: true, email: true } },
      reviewer: { select: { name: true } },
    },
  })

  if (!submission) notFound()

  const { profile } = submission
  const hasAiSummary = !!profile.aiSummary

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader
        title={profile.fullName}
        description={`${profile.currentTitle ?? "Candidate"} · Submitted by ${submission.vendor.name}`}
        breadcrumb={
          <Link href={ROUTES.DASHBOARD_CANDIDATES} className="text-primary hover:underline">
            ← Candidates
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            {profile.resumeUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  Download CV
                </a>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          <AiSummaryCard
            summary={profile.aiSummary}
            status={profile.aiSummary?.status ?? "PENDING"}
            profileId={profile.id}
            submissionId={submission.id}
          />

          {/* Profile Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Quick stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: Briefcase, label: "Experience", value: profile.experienceYears ? `${profile.experienceYears} years` : "—" },
                  { icon: MapPin, label: "Location", value: profile.location ?? "—" },
                  { icon: Clock, label: "Notice period", value: profile.noticePeriodDays ? `${profile.noticePeriodDays} days` : "—" },
                  { icon: Globe, label: "Work auth", value: profile.workAuthorization ?? "—" },
                  { icon: DollarSign, label: "Expected salary", value: profile.expectedSalaryMin ? `${profile.salaryCurrency} ${(profile.expectedSalaryMin / 100000).toFixed(1)}L${profile.expectedSalaryMax ? `–${(profile.expectedSalaryMax / 100000).toFixed(1)}L` : "+"}` : "—" },
                  { icon: GraduationCap, label: "Education", value: profile.highestDegree ?? "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <p className="text-sm font-medium truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Skills */}
              {profile.skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {(profile.linkedinUrl || profile.portfolioUrl) && (
                <div className="flex items-center gap-3">
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  )}
                  {profile.portfolioUrl && (
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Portfolio
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet. Add observations for your team.</p>
              ) : (
                <div className="space-y-3">
                  {profile.notes.map((note) => (
                    <div key={note.id} className="rounded-lg bg-secondary/50 p-4">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {note.author.name ?? note.author.email} · {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {/* Note input form would go here — implemented as client component */}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={submission.status} type="submission" showDot />
                <span className="text-xs text-muted-foreground">{formatDate(submission.submittedAt)}</span>
              </div>
              {submission.reviewer && (
                <p className="text-xs text-muted-foreground">
                  Reviewed by {submission.reviewer.name}
                </p>
              )}
              <CandidateStatusActions
                submissionId={submission.id}
                currentStatus={submission.status}
              />
            </CardContent>
          </Card>

          {/* Vendor info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Submitted by</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {submission.vendor.logoUrl ? (
                  <img src={submission.vendor.logoUrl} alt={submission.vendor.name} className="h-9 w-9 rounded-lg object-contain border" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{submission.vendor.name}</p>
                  <p className="text-xs text-muted-foreground">{submission.vendor.email}</p>
                </div>
              </div>
              {submission.vendorNotes && (
                <div className="mt-4 rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Vendor notes:</p>
                  <p className="text-sm">{submission.vendorNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Submitted", date: submission.submittedAt },
                  ...(submission.reviewedAt ? [{ label: "Reviewed", date: submission.reviewedAt }] : []),
                ].map((event) => (
                  <div key={event.label} className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-xs font-medium">{event.label}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(event.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
