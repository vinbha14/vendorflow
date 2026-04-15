// services/candidate.service.ts
"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { AUDIT_ACTIONS, NOTIFICATION_TYPES } from "@/config/constants"
import { headers } from "next/headers"
import { z } from "zod"
import type { CandidateSubmissionStatus } from "@prisma/client"

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────
export const candidateProfileSchema = z.object({
  // Required
  fullName: z.string().min(2, "Name must be at least 2 characters").max(120),
  // Contact
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  // Professional
  currentTitle: z.string().min(1, "Current title is required").max(120),
  currentCompany: z.string().optional(),
  experienceYears: z.number().min(0).max(50),
  // Location
  location: z.string().optional(),
  country: z.string().default("IN"),
  // Skills & expertise
  skills: z.array(z.string()).min(1, "At least one skill is required").max(30),
  domainExpertise: z.array(z.string()).max(10),
  // Availability
  noticePeriodDays: z.number().min(0).max(365).optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP"]).optional(),
  // Compensation
  expectedSalaryMin: z.number().positive().optional(),
  expectedSalaryMax: z.number().positive().optional(),
  salaryCurrency: z.string().default("INR"),
  salaryPeriod: z.string().default("ANNUAL"),
  // Compliance
  workAuthorization: z.string().optional(),
  // Education
  highestDegree: z.string().optional(),
  university: z.string().optional(),
  graduationYear: z.number().min(1970).max(new Date().getFullYear() + 5).optional(),
  // Links
  linkedinUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  // CV
  resumeUrl: z.string().optional(),
  resumeKey: z.string().optional(),
  // Internal
  vendorNotes: z.string().max(1000).optional(),
  // Which company to submit to
  companyId: z.string().uuid("Select a company"),
})

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Submit a new candidate profile
// Called by vendor recruiters / admins
// ─────────────────────────────────────────────────────────────────────────────
export async function submitCandidateProfile(
  rawInput: CandidateProfileInput
): Promise<{ success: boolean; profileId?: string; submissionId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const parsed = candidateProfileSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const data = parsed.data

  // Get vendor context
  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { vendor: true },
  })
  if (!vendorUser) return { success: false, error: "Vendor account not found" }

  // Verify vendor is approved for this company
  const vendorCompany = await prisma.vendorCompany.findUnique({
    where: {
      vendorId_companyId: {
        vendorId: vendorUser.vendorId,
        companyId: data.companyId,
      },
    },
  })
  if (!vendorCompany || vendorCompany.status !== "APPROVED") {
    return { success: false, error: "Your vendor account is not approved for this company" }
  }

  // Create profile + submission + AI summary placeholder in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the profile
    const profile = await tx.candidateProfile.create({
      data: {
        vendorId: vendorUser.vendorId,
        fullName: data.fullName,
        email: data.email || undefined,
        phone: data.phone,
        currentTitle: data.currentTitle,
        currentCompany: data.currentCompany,
        experienceYears: data.experienceYears,
        location: data.location,
        country: data.country,
        skills: data.skills,
        domainExpertise: data.domainExpertise,
        noticePeriodDays: data.noticePeriodDays,
        employmentType: data.employmentType,
        expectedSalaryMin: data.expectedSalaryMin,
        expectedSalaryMax: data.expectedSalaryMax,
        salaryCurrency: data.salaryCurrency,
        salaryPeriod: data.salaryPeriod,
        workAuthorization: data.workAuthorization,
        highestDegree: data.highestDegree,
        university: data.university,
        graduationYear: data.graduationYear,
        linkedinUrl: data.linkedinUrl || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
        resumeUrl: data.resumeUrl,
      },
    })

    // Create the submission (profile → company)
    const submission = await tx.candidateSubmission.create({
      data: {
        profileId: profile.id,
        companyId: data.companyId,
        vendorId: vendorUser.vendorId,
        vendorNotes: data.vendorNotes,
        status: "SUBMITTED",
      },
    })

    // Create AI summary placeholder
    await tx.aiSummary.create({
      data: {
        profileId: profile.id,
        status: "PENDING",
      },
    })

    // Update vendor submission count
    await tx.vendorCompany.update({
      where: { vendorId_companyId: { vendorId: vendorUser.vendorId, companyId: data.companyId } },
      data: { submissionsCount: { increment: 1 } },
    })

    await tx.vendor.update({
      where: { id: vendorUser.vendorId },
      data: { totalSubmissions: { increment: 1 } },
    })

    return { profile, submission }
  })

  // Notify hiring managers
  await notifyHiringManagers(data.companyId, result.profile.fullName, vendorUser.vendor.name)

  // Write audit log
  await prisma.auditLog.create({
    data: {
      companyId: data.companyId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: vendorUser.role,
      action: AUDIT_ACTIONS.CANDIDATE_SUBMITTED,
      entity: "CandidateSubmission",
      entityId: result.submission.id,
      after: {
        candidateName: data.fullName,
        vendorId: vendorUser.vendorId,
        companyId: data.companyId,
      },
      ipAddress: await getClientIp(),
    },
  })

  // TODO: Trigger AI summary job via Trigger.dev
  // await triggerAiSummary.trigger({ profileId: result.profile.id })
  // TODO: Trigger duplicate detection job
  // await triggerDuplicateDetection.trigger({ profileId: result.profile.id, companyId: data.companyId })

  return {
    success: true,
    profileId: result.profile.id,
    submissionId: result.submission.id,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Update candidate submission status (hiring manager / company admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function updateSubmissionStatus(
  submissionId: string,
  newStatus: CandidateSubmissionStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const submission = await prisma.candidateSubmission.findUnique({
    where: { id: submissionId },
    include: { profile: { select: { fullName: true } } },
  })
  if (!submission) return { success: false, error: "Submission not found" }

  // Verify user has access to this company
  const membership = await prisma.companyMember.findUnique({
    where: {
      userId_companyId: { userId: session.user.id, companyId: submission.companyId },
    },
  })
  if (!membership || !membership.isActive) return { success: false, error: "Unauthorized" }

  const oldStatus = submission.status

  await prisma.candidateSubmission.update({
    where: { id: submissionId },
    data: {
      status: newStatus,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      internalNotes: notes,
      ...(newStatus === "HIRED" && {
        // Update vendor accepted count
      }),
    },
  })

  // If hired, update vendor stats
  if (newStatus === "HIRED") {
    await prisma.vendorCompany.update({
      where: {
        vendorId_companyId: {
          vendorId: submission.vendorId,
          companyId: submission.companyId,
        },
      },
      data: { acceptedCount: { increment: 1 } },
    })
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      companyId: submission.companyId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: membership.role,
      action: AUDIT_ACTIONS.CANDIDATE_STATUS_CHANGED,
      entity: "CandidateSubmission",
      entityId: submissionId,
      before: { status: oldStatus },
      after: { status: newStatus, notes },
      ipAddress: await getClientIp(),
    },
  })

  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Get vendor's submitted candidates
// ─────────────────────────────────────────────────────────────────────────────
export async function getVendorSubmissions(vendorId: string) {
  return prisma.candidateSubmission.findMany({
    where: { vendorId },
    orderBy: { submittedAt: "desc" },
    include: {
      profile: {
        select: {
          fullName: true,
          currentTitle: true,
          skills: true,
          location: true,
          experienceYears: true,
          resumeUrl: true,
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Get company's candidate queue (for hiring manager dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export async function getCompanyCandidates(
  companyId: string,
  filters?: {
    status?: CandidateSubmissionStatus
    vendorId?: string
    search?: string
    page?: number
    pageSize?: number
  }
) {
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const where = {
    companyId,
    ...(filters?.status && { status: filters.status }),
    ...(filters?.vendorId && { vendorId: filters.vendorId }),
    ...(filters?.search && {
      profile: {
        OR: [
          { fullName: { contains: filters.search, mode: "insensitive" as const } },
          { currentTitle: { contains: filters.search, mode: "insensitive" as const } },
          { skills: { has: filters.search } },
        ],
      },
    }),
  }

  const [submissions, total] = await Promise.all([
    prisma.candidateSubmission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip,
      take: pageSize,
      include: {
        profile: {
          include: {
            aiSummary: {
              select: {
                status: true,
                fitScore: true,
                executiveSummary: true,
                recommendedAction: true,
              },
            },
          },
        },
        vendor: { select: { name: true, logoUrl: true } },
        reviewer: { select: { name: true } },
      },
    }),
    prisma.candidateSubmission.count({ where }),
  ])

  return { submissions, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
async function notifyHiringManagers(
  companyId: string,
  candidateName: string,
  vendorName: string
) {
  const managers = await prisma.companyMember.findMany({
    where: { companyId, isActive: true },
    select: { userId: true },
  })

  await Promise.all(
    managers.map((m) =>
      prisma.notification.create({
        data: {
          userId: m.userId,
          companyId,
          type: NOTIFICATION_TYPES.SUBMISSION_RECEIVED,
          title: "New candidate submitted",
          body: `${vendorName} submitted ${candidateName}`,
          link: "/dashboard/candidates",
        },
      }).catch(() => {}) // Non-critical
    )
  )
}

async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  )
}
