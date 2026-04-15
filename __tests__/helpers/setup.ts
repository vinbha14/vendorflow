// __tests__/helpers/setup.ts
// Global setup that runs before every test file.
// Mocks external services so tests never make real network calls.

import "@testing-library/jest-dom"
import { vi, beforeEach, afterEach } from "vitest"

// ─── Mock Next.js navigation ────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// ─── Mock next-auth ──────────────────────────────────────────────────────────
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: "user-test-id",
        email: "test@example.com",
        name: "Test User",
        globalRole: "USER",
      },
    },
    status: "authenticated",
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// ─── Mock Prisma client ──────────────────────────────────────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    companyMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    vendor: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    vendorCompany: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    vendorUser: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    candidateProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    candidateSubmission: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    aiSummary: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    duplicateAlert: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    duplicateReview: {
      create: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      groupBy: vi.fn(),
    },
    plan: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    invitation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    verificationToken: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    usageRecord: {
      create: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({
      candidateProfile: { create: vi.fn() },
      candidateSubmission: { create: vi.fn() },
      aiSummary: { create: vi.fn() },
      vendorCompany: { update: vi.fn() },
      vendor: { update: vi.fn() },
      duplicateReview: { create: vi.fn() },
      duplicateAlert: { update: vi.fn() },
      company: { create: vi.fn() },
      companyBranding: { create: vi.fn() },
      companyMember: { create: vi.fn() },
    })),
  },
}))

// ─── Mock OpenAI ─────────────────────────────────────────────────────────────
vi.mock("@/lib/openai", () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(() => Promise.resolve({
          choices: [{ message: { content: JSON.stringify({
            executiveSummary: "Test summary",
            keySkillsSummary: "React, TypeScript",
            experienceSummary: "5 years",
            domainSummary: "SaaS",
            strengthsSummary: "Strong technical skills",
            possibleConcerns: "Limited domain experience",
            workAuthSummary: "Indian Citizen",
            noticePeriodSummary: "30 days",
            salarySummary: "₹15-20L per annum",
            recommendedAction: "Shortlist for technical screening",
            fitScore: 78,
          }) } }],
          usage: { prompt_tokens: 500, completion_tokens: 300 },
        })),
      },
    },
    embeddings: {
      create: vi.fn(() => Promise.resolve({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      })),
    },
  },
  estimateCost: vi.fn(() => 0.015),
  truncateToTokenBudget: vi.fn((text: string) => text),
  AI_CONFIG: {
    SUMMARY_MODEL: "gpt-4o",
    EMBEDDING_MODEL: "text-embedding-3-small",
    EMBEDDING_DIMENSIONS: 1536,
    DUPLICATE_THRESHOLD_POSSIBLE: 0.5,
    DUPLICATE_THRESHOLD_LIKELY: 0.7,
    DUPLICATE_THRESHOLD_HIGH: 0.9,
    NAME_SIMILARITY_THRESHOLD: 3,
    SEMANTIC_SIMILARITY_THRESHOLD: 0.85,
    MAX_RESUME_TOKENS: 3000,
  },
}))

// ─── Mock Stripe ─────────────────────────────────────────────────────────────
vi.mock("stripe", () => {
  const MockStripe = vi.fn(() => ({
    checkout: {
      sessions: { create: vi.fn(() => Promise.resolve({ url: "https://checkout.stripe.com/test", id: "cs_test" })) },
    },
    customers: {
      create: vi.fn(() => Promise.resolve({ id: "cus_test123" })),
    },
    billingPortal: {
      sessions: { create: vi.fn(() => Promise.resolve({ url: "https://billing.stripe.com/test" })) },
    },
    webhooks: {
      constructEvent: vi.fn(() => ({ type: "checkout.session.completed", data: { object: {} } })),
    },
  }))
  return { default: MockStripe }
})

// ─── Mock Resend ─────────────────────────────────────────────────────────────
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn(() => Promise.resolve({ data: { id: "email-test-id" }, error: null })),
    },
  })),
}))

// ─── Mock headers() and auth() from Next.js ──────────────────────────────────
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => {
      const map: Record<string, string> = {
        "x-tenant-id": "tenant-test-id",
        "x-tenant-slug": "test-company",
        "x-is-tenant": "true",
        "x-forwarded-for": "127.0.0.1",
      }
      return map[key] ?? null
    }),
  })),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// ─── Reset all mocks between tests ───────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})
