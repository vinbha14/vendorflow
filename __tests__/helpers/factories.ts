// __tests__/helpers/factories.ts
// Factory functions for creating typed test data.
// Use these in tests instead of hand-writing objects.

import type {
  User, Company, CompanyMember, Vendor, VendorCompany,
  CandidateProfile, CandidateSubmission, AiSummary,
  DuplicateAlert, Subscription, Plan, Invitation,
} from "@prisma/client"

// ─── Counters for unique IDs ──────────────────────────────────────────────────
let counter = 0
const id = () => `test-id-${++counter}`
const uuid = () => `${id()}-0000-0000-0000-${String(counter).padStart(12, "0")}`

// ─── User ─────────────────────────────────────────────────────────────────────
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: uuid(),
    email: `user-${counter}@example.com`,
    name: "Test User",
    image: null,
    hashedPassword: "$2a$12$hashedpassword",
    emailVerified: new Date("2024-01-01"),
    globalRole: "USER",
    isActive: true,
    lastLoginAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }
}

export function makeSuperAdmin(overrides: Partial<User> = {}): User {
  return makeUser({ globalRole: "SUPER_ADMIN", email: "admin@vendorflow.com", ...overrides })
}

// ─── Company ──────────────────────────────────────────────────────────────────
export function makeCompany(overrides: Partial<Company> = {}): Company {
  const n = ++counter
  return {
    id: uuid(),
    name: `Test Company ${n}`,
    slug: `test-company-${n}`,
    subdomain: `test-company-${n}`,
    logoUrl: null,
    website: null,
    legalName: `Test Company ${n} Pvt Ltd`,
    taxId: `GST${n}`,
    country: "IN",
    state: "Karnataka",
    city: "Bangalore",
    address: "123 Test Street",
    postalCode: "560001",
    currency: "INR",
    timezone: "Asia/Kolkata",
    industry: "Technology",
    size: "51-200",
    status: "ACTIVE",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    deletedAt: null,
    ...overrides,
  }
}

// ─── Company Member ───────────────────────────────────────────────────────────
export function makeCompanyMember(
  userId: string,
  companyId: string,
  overrides: Partial<CompanyMember> = {}
): CompanyMember {
  return {
    id: uuid(),
    userId,
    companyId,
    role: "COMPANY_ADMIN",
    isActive: true,
    invitedBy: null,
    joinedAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }
}

// ─── Vendor ───────────────────────────────────────────────────────────────────
export function makeVendor(overrides: Partial<Vendor> = {}): Vendor {
  const n = ++counter
  return {
    id: uuid(),
    name: `Test Vendor ${n}`,
    email: `vendor-${n}@example.com`,
    phone: `+91 98765 ${String(n).padStart(5, "0")}`,
    website: null,
    legalName: null,
    taxId: null,
    country: "IN",
    city: "Mumbai",
    address: null,
    serviceCategories: ["Software Engineering", "DevOps"],
    geographicCoverage: ["Mumbai", "Bangalore"],
    domainExpertise: ["FinTech"],
    logoUrl: null,
    description: "A test vendor agency",
    status: "APPROVED",
    overallRating: 4.5,
    totalSubmissions: 10,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    deletedAt: null,
    ...overrides,
  }
}

// ─── VendorCompany ────────────────────────────────────────────────────────────
export function makeVendorCompany(
  vendorId: string,
  companyId: string,
  overrides: Partial<VendorCompany> = {}
): VendorCompany {
  return {
    id: uuid(),
    vendorId,
    companyId,
    status: "APPROVED",
    onboardingNotes: null,
    contractStartDate: null,
    contractEndDate: null,
    rating: 4.5,
    submissionsCount: 5,
    acceptedCount: 2,
    approvedBy: uuid(),
    approvedAt: new Date("2024-01-15"),
    rejectedReason: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }
}

// ─── CandidateProfile ─────────────────────────────────────────────────────────
export function makeCandidateProfile(
  vendorId: string,
  overrides: Partial<CandidateProfile> = {}
): CandidateProfile {
  const n = ++counter
  return {
    id: uuid(),
    vendorId,
    fullName: `Candidate ${n}`,
    email: `candidate-${n}@email.com`,
    phone: `+91 99887 ${String(n).padStart(5, "0")}`,
    currentTitle: "Senior Developer",
    currentCompany: "Tech Corp",
    experienceYears: 5,
    location: "Bangalore",
    country: "IN",
    skills: ["React", "TypeScript", "Node.js"],
    domainExpertise: ["SaaS"],
    noticePeriodDays: 30,
    availableFrom: null,
    employmentType: "FULL_TIME",
    expectedSalaryMin: 1500000,
    expectedSalaryMax: 2000000,
    salaryCurrency: "INR",
    salaryPeriod: "ANNUAL",
    workAuthorization: "Indian Citizen",
    visaType: null,
    highestDegree: "B.Tech Computer Science",
    university: "IIT Bombay",
    graduationYear: 2019,
    resumeUrl: "https://storage.example.com/cv/test.pdf",
    resumeText: "Experienced developer with 5 years...",
    linkedinUrl: null,
    portfolioUrl: null,
    rawParsedData: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    deletedAt: null,
    ...overrides,
  }
}

// ─── CandidateSubmission ──────────────────────────────────────────────────────
export function makeCandidateSubmission(
  profileId: string,
  companyId: string,
  vendorId: string,
  overrides: Partial<CandidateSubmission> = {}
): CandidateSubmission {
  return {
    id: uuid(),
    profileId,
    companyId,
    vendorId,
    jobId: null,
    status: "SUBMITTED",
    reviewedBy: null,
    reviewedAt: null,
    vendorNotes: "Strong candidate",
    internalNotes: null,
    rejectedReason: null,
    interviewStage: null,
    hasDuplicateAlert: false,
    submittedAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    ...overrides,
  }
}

// ─── AiSummary ────────────────────────────────────────────────────────────────
export function makeAiSummary(profileId: string, overrides: Partial<AiSummary> = {}): AiSummary {
  return {
    id: uuid(),
    profileId,
    status: "COMPLETED",
    executiveSummary: "Strong senior developer with 5 years of experience.",
    keySkillsSummary: "React, TypeScript, Node.js — advanced level.",
    experienceSummary: "5 years at major tech companies.",
    domainSummary: "SaaS and enterprise software.",
    strengthsSummary: "Deep technical expertise and team leadership.",
    possibleConcerns: "Limited exposure to financial domain.",
    workAuthSummary: "Indian Citizen — no visa required for India roles.",
    noticePeriodSummary: "30 days — can potentially negotiate buy-out.",
    salarySummary: "Expecting ₹15-20L per annum — market rate for this level.",
    recommendedAction: "Shortlist for technical screening. Schedule React/TypeScript assessment.",
    fitScore: 78,
    model: "gpt-4o",
    promptTokens: 500,
    completionTokens: 300,
    totalCost: 0.0145,
    errorMessage: null,
    generatedAt: new Date("2024-01-10"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    ...overrides,
  }
}

// ─── DuplicateAlert ───────────────────────────────────────────────────────────
export function makeDuplicateAlert(
  companyId: string,
  profileAId: string,
  profileBId: string,
  overrides: Partial<DuplicateAlert> = {}
): DuplicateAlert {
  return {
    id: uuid(),
    companyId,
    profileAId,
    profileBId,
    confidenceScore: 0.91,
    severity: "HIGH_CONFIDENCE",
    status: "OPEN",
    matchedFields: ["email", "current_company", "university"],
    matchReason: "Profiles share identical email and university.",
    detectionLayer: "DETERMINISTIC",
    similarityScore: 0.89,
    detectedAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    ...overrides,
  }
}

// ─── Plan ─────────────────────────────────────────────────────────────────────
export function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: uuid(),
    name: "growth",
    displayName: "Growth",
    description: "For growing teams",
    maxVendors: 50,
    maxTeamMembers: 10,
    hasAiSummaries: true,
    hasDuplicateDetection: true,
    hasCustomBranding: true,
    hasApiAccess: true,
    hasPrioritySupport: false,
    hasAuditLogs: true,
    hasSso: false,
    monthlyPrice: new (require("@prisma/client").Prisma.Decimal)(149),
    annualPrice: new (require("@prisma/client").Prisma.Decimal)(1430),
    currency: "USD",
    stripePriceIdMonthly: "price_growth_monthly",
    stripePriceIdAnnual: "price_growth_annual",
    sortOrder: 2,
    isActive: true,
    isFeatured: true,
    badgeText: "Most Popular",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export function makeSubscription(
  companyId: string,
  planId: string,
  overrides: Partial<Subscription> = {}
): Subscription {
  return {
    id: uuid(),
    companyId,
    planId,
    stripeCustomerId: "cus_test123",
    stripeSubscriptionId: "sub_test123",
    stripePriceId: "price_growth_monthly",
    status: "ACTIVE",
    billingCycle: "MONTHLY",
    currentPeriodStart: new Date("2024-01-01"),
    currentPeriodEnd: new Date("2024-02-01"),
    trialStartsAt: null,
    trialEndsAt: null,
    canceledAt: null,
    cancelAtPeriodEnd: false,
    activeVendorCount: 5,
    pastDueSince: null,
    gracePeriodEndsAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }
}

// ─── Invitation ───────────────────────────────────────────────────────────────
export function makeInvitation(
  companyId: string,
  invitedBy: string,
  overrides: Partial<Invitation> = {}
): Invitation {
  return {
    id: uuid(),
    companyId,
    invitedBy,
    email: `invite-${counter}@vendor.com`,
    type: "VENDOR",
    role: null,
    token: `token-${uuid()}`,
    status: "PENDING",
    vendorName: "Test Vendor Agency",
    message: "Please join our vendor portal.",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    acceptedAt: null,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  }
}
