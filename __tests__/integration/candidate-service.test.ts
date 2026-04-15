// __tests__/integration/candidate-service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import {
  makeUser, makeVendor, makeVendorCompany,
  makeCandidateProfile, makeCandidateSubmission,
} from "../helpers/factories"

// Mock auth to return a vendor user
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  requireAuth: vi.fn(),
}))

import { auth } from "@/lib/auth"

const mockVendorUser = makeUser({ email: "vendor@test.com" })
const mockVendor = makeVendor()
const mockCompany = { id: "company-test-id" }

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue({
    user: {
      id: mockVendorUser.id,
      email: mockVendorUser.email,
      name: mockVendorUser.name,
      globalRole: "USER",
    },
  } as any)

  // Set up vendor user association mock
  vi.mocked(prisma.vendorUser.findFirst).mockResolvedValue({
    id: "vu-id",
    userId: mockVendorUser.id,
    vendorId: mockVendor.id,
    role: "RECRUITER",
    isActive: true,
    joinedAt: new Date(),
    vendor: mockVendor,
  } as any)
})

describe("submitCandidateProfile", () => {
  it("rejects submission when vendor not approved for company", async () => {
    vi.mocked(prisma.vendorCompany.findUnique).mockResolvedValue({
      ...makeVendorCompany(mockVendor.id, mockCompany.id),
      status: "PENDING", // Not yet approved
    } as any)

    const { submitCandidateProfile } = await import("@/services/candidate.service")

    const result = await submitCandidateProfile({
      fullName: "Test Candidate",
      currentTitle: "Developer",
      experienceYears: 5,
      companyId: mockCompany.id,
      country: "IN",
      skills: ["React"],
      domainExpertise: [],
      salaryCurrency: "INR",
      salaryPeriod: "ANNUAL",
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("not approved")
  })

  it("rejects submission when no vendor user found", async () => {
    vi.mocked(prisma.vendorUser.findFirst).mockResolvedValue(null)

    const { submitCandidateProfile } = await import("@/services/candidate.service")

    const result = await submitCandidateProfile({
      fullName: "Test Candidate",
      currentTitle: "Developer",
      experienceYears: 5,
      companyId: mockCompany.id,
      country: "IN",
      skills: ["React"],
      domainExpertise: [],
      salaryCurrency: "INR",
      salaryPeriod: "ANNUAL",
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("Vendor account not found")
  })

  it("rejects unauthenticated submission", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const { submitCandidateProfile } = await import("@/services/candidate.service")

    const result = await submitCandidateProfile({
      fullName: "Test Candidate",
      currentTitle: "Developer",
      experienceYears: 5,
      companyId: mockCompany.id,
      country: "IN",
      skills: ["React"],
      domainExpertise: [],
      salaryCurrency: "INR",
      salaryPeriod: "ANNUAL",
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Unauthorized")
  })

  it("validates required fields", async () => {
    vi.mocked(prisma.vendorCompany.findUnique).mockResolvedValue(
      makeVendorCompany(mockVendor.id, mockCompany.id) as any
    )

    const { submitCandidateProfile } = await import("@/services/candidate.service")

    const result = await submitCandidateProfile({
      fullName: "", // Empty name
      currentTitle: "Developer",
      experienceYears: 5,
      companyId: mockCompany.id,
      country: "IN",
      skills: [],  // Empty skills
      domainExpertise: [],
      salaryCurrency: "INR",
      salaryPeriod: "ANNUAL",
    })

    expect(result.success).toBe(false)
  })
})

describe("updateSubmissionStatus", () => {
  const mockSubmission = makeCandidateSubmission(
    "profile-id",
    mockCompany.id,
    mockVendor.id
  )

  it("rejects status update when user not in company", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "other-user-id", email: "other@test.com", globalRole: "USER" },
    } as any)

    vi.mocked(prisma.candidateSubmission.findUnique).mockResolvedValue(mockSubmission as any)
    vi.mocked(prisma.companyMember.findUnique).mockResolvedValue(null)

    const { updateSubmissionStatus } = await import("@/services/candidate.service")
    const result = await updateSubmissionStatus(mockSubmission.id, "SHORTLISTED")

    expect(result.success).toBe(false)
    expect(result.error).toBe("Unauthorized")
  })

  it("returns not found for non-existent submission", async () => {
    vi.mocked(prisma.candidateSubmission.findUnique).mockResolvedValue(null)

    const { updateSubmissionStatus } = await import("@/services/candidate.service")
    const result = await updateSubmissionStatus("nonexistent-id", "SHORTLISTED")

    expect(result.success).toBe(false)
    expect(result.error).toBe("Submission not found")
  })
})
