// app/vendor/candidates/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ROUTES, SUBMISSION_STATUS_LABELS } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import {
  Building2, ArrowLeft, Download, Clock, MapPin,
  Briefcase, CheckCircle2, XCircle, Star,
} from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Candidate Submission" }

const STATUS_STEPS = [
  "SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "OFFER_SENT", "HIRED",
]

export default async function VendorCandidateDetailPage({
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

  const submission = await prisma.candidateSubmission.findFirst({
    where: { id, vendorId: vendorUser.vendorId },
    include: {
      profile: {
        select: {
          fullName: true,
          currentTitle: true,
          currentCompany: true,
          experienceYears: true,
          location: true,
          skills: true,
          noticePeriodDays: true,
          expectedSalaryMin: true,
          expectedSalaryMax: true,
          salaryCurrency: true,
          workAuthorization: true,
          resumeUrl: true,
          email: true,
          phone: true,
        },
      },
      company: {
        select: {
          name: true,
          logoUrl: true,
          country: true,
          branding: {
            select: { primaryColor: true, tagline: true, supportEmail: true },
          },
        },
      },
    },
  })

  if (!submission) notFound()

  const { profile, company } = submission
  const primaryColor = company.branding?.primaryColor ?? "#4F46E5"
  const currentStepIndex = STATUS_STEPS.indexOf(submission.status)
  const isRejected = submission.status === "REJECTED" || submission.status === "WITHDRAWN"

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title={profile.fullName}
        description={`${profile.currentTitle ?? "Candidate"} · ${company.name}`}
        breadcrumb={
          <Link href={ROUTES.VENDOR_CANDIDATES} className="text-primary hover:underline">
            ← My candidates
          </Link>
        }
        actions={
          profile.resumeUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Download CV
              </a>
            </Button>
          )
        }
      />

      {/* Company branding card — vendor sees the company they submitted to */}
      <Card className="overflow-hidden">
        <div className="h-2" style={{ backgroundColor: primaryColor }} />
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-12 w-12 rounded-xl object-contain border bg-white p-1" />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-white text-lg font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {company.name[0]}
              </div>
            )}
            <div>
              <p className="font-semibold">{company.name}</p>
              {company.branding?.tagline && (
                <p className="text-sm text-muted-foreground">{company.branding.tagline}</p>
              )}
              {company.branding?.supportEmail && (
                <a href={`mailto:${company.branding.supportEmail}`} className="text-xs text-primary hover:underline">
                  {company.branding.supportEmail}
                </a>
              )}
            </div>
            <StatusBadge status={submission.status} type="submission" showDot className="ml-auto" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Submission status</CardTitle>
            </CardHeader>
            <CardContent>
              {isRejected ? (
                <div className="flex items-center gap-3 rounded-lg bg-destructive/5 border border-destructive/20 p-4">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive text-sm">Submission {submission.status.toLowerCase()}</p>
                    {submission.rejectedReason && (
                      <p className="text-sm text-muted-foreground mt-0.5">{submission.rejectedReason}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, i) => {
                    const isCompleted = i < currentStepIndex
                    const isCurrent = i === currentStepIndex
                    const isUpcoming = i > currentStepIndex
                    return (
                      <div key={step} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 z-10 ${
                            isCompleted ? "border-success bg-success text-white" :
                            isCurrent ? "border-primary bg-primary text-white" :
                            "border-border bg-background text-muted-foreground"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-semibold">{i + 1}</span>
                            )}
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`w-0.5 h-8 mt-0 ${isCompleted ? "bg-success" : "bg-border"}`} />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={`text-sm font-medium ${isCurrent ? "text-primary" : isUpcoming ? "text-muted-foreground" : "text-foreground"}`}>
                            {SUBMISSION_STATUS_LABELS[step] ?? step}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-primary/70 mt-0.5">Current stage</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Candidate profile summary */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Candidate profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Briefcase, label: "Experience", value: profile.experienceYears ? `${profile.experienceYears} years` : "—" },
                  { icon: MapPin, label: "Location", value: profile.location ?? "—" },
                  { icon: Clock, label: "Notice period", value: profile.noticePeriodDays ? `${profile.noticePeriodDays} days` : "—" },
                  { icon: Building2, label: "Current company", value: profile.currentCompany ?? "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
              {profile.skills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Submission details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium">{formatDate(submission.submittedAt)}</span>
              </div>
              {submission.reviewedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last reviewed</span>
                  <span className="font-medium">{formatDate(submission.reviewedAt)}</span>
                </div>
              )}
              {submission.vendorNotes && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Your notes:</p>
                  <p className="text-sm italic">{submission.vendorNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" size="sm" className="w-full gap-2" asChild>
            <Link href={ROUTES.VENDOR_CANDIDATES_NEW}>
              Submit another candidate
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
