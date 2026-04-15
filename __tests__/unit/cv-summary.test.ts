// __tests__/unit/cv-summary.test.ts
// Tests the CV summary service: schema validation, profile text builder,
// cost estimation, recommendation enum values.

import { describe, it, expect, vi, beforeEach } from "vitest"
import { estimateCost, truncateToTokenBudget, estimateTokens } from "@/lib/openai"
import {
  RECOMMENDATION_DECISIONS,
  RECOMMENDATION_META,
  type RecommendationDecision,
} from "@/services/ai/cv-summary.service"
import { z } from "zod"

// ─── Zod schema (re-declared here to keep test self-contained) ────────────────
// We validate the same shape the service sends to GPT-4o

const summaryOutputSchema = z.object({
  headlineSummary:       z.string().max(180),
  yearsOfExperience:     z.number().min(0).max(50),
  topSkills:             z.array(z.string()).min(3).max(10),
  industries:            z.array(z.string()).min(1).max(6),
  employers:             z.array(z.string()).min(0).max(8),
  strengthsList:         z.array(z.string()).min(2).max(4),
  risksList:             z.array(z.string()).min(1).max(4),
  recommendationDecision: z.enum(["SHORTLIST", "REVIEW", "HOLD", "REJECT"]),
  executiveSummary:      z.string(),
  keySkillsSummary:      z.string(),
  experienceSummary:     z.string(),
  domainSummary:         z.string(),
  strengthsSummary:      z.string(),
  possibleConcerns:      z.string(),
  workAuthSummary:       z.string(),
  noticePeriodSummary:   z.string(),
  locationSummary:       z.string(),
  salarySummary:         z.string(),
  recommendedAction:     z.string(),
  fitScore:              z.number().int().min(0).max(100),
})

// ─── Valid fixture — what a well-formed GPT-4o response looks like ────────────

const validSummary = {
  headlineSummary:       "Senior React developer with 6 years in SaaS and fintech, recently at Infosys.",
  yearsOfExperience:     6,
  topSkills:             ["React 18", "TypeScript", "Node.js", "GraphQL", "AWS Lambda"],
  industries:            ["FinTech", "SaaS", "E-Commerce"],
  employers:             ["Infosys", "TCS", "StartupXYZ"],
  strengthsList:         ["Full-stack delivery across 3 production SaaS products", "Strong system design background"],
  risksList:             ["No cloud certifications despite 3 years of AWS usage"],
  recommendationDecision: "SHORTLIST" as RecommendationDecision,
  executiveSummary:      "Amit is a seasoned React developer with 6 years of experience...",
  keySkillsSummary:      "Proficient in React 18, TypeScript, and Node.js...",
  experienceSummary:     "Progressed from junior to senior in 3 years...",
  domainSummary:         "Primarily FinTech and SaaS products...",
  strengthsSummary:      "Strong delivery record with measurable business impact...",
  possibleConcerns:      "No cloud certifications despite regular AWS usage...",
  workAuthSummary:       "Indian Citizen — no visa required for India-based roles.",
  noticePeriodSummary:   "30-day notice period. Potential for buyout discussion.",
  locationSummary:       "Based in Bangalore, India. Open to hybrid and remote roles.",
  salarySummary:         "Expecting ₹18–22L per annum — at market for this level.",
  recommendedAction:     "SHORTLIST: Schedule a 30-min technical screen focusing on React architecture.",
  fitScore:              78,
}

// ─── Schema validation ────────────────────────────────────────────────────────

describe("summaryOutputSchema", () => {
  it("accepts a valid well-formed summary", () => {
    const result = summaryOutputSchema.safeParse(validSummary)
    expect(result.success).toBe(true)
  })

  describe("headlineSummary", () => {
    it("accepts a concise headline under 180 chars", () => {
      expect(summaryOutputSchema.safeParse(validSummary).success).toBe(true)
    })
    it("rejects a headline over 180 characters", () => {
      const bad = { ...validSummary, headlineSummary: "x".repeat(181) }
      expect(summaryOutputSchema.safeParse(bad).success).toBe(false)
    })
  })

  describe("yearsOfExperience", () => {
    it("accepts 0 years", () => {
      expect(summaryOutputSchema.safeParse({ ...validSummary, yearsOfExperience: 0 }).success).toBe(true)
    })
    it("accepts decimal years (e.g. 6.5)", () => {
      expect(summaryOutputSchema.safeParse({ ...validSummary, yearsOfExperience: 6.5 }).success).toBe(true)
    })
    it("rejects negative years", () => {
      expect(summaryOutputSchema.safeParse({ ...validSummary, yearsOfExperience: -1 }).success).toBe(false)
    })
    it("rejects years > 50", () => {
      expect(summaryOutputSchema.safeParse({ ...validSummary, yearsOfExperience: 51 }).success).toBe(false)
    })
  })

  describe("topSkills", () => {
    it("requires at least 3 skills", () => {
      const bad = { ...validSummary, topSkills: ["React", "TypeScript"] }
      expect(summaryOutputSchema.safeParse(bad).success).toBe(false)
    })
    it("accepts exactly 3 skills", () => {
      const ok = { ...validSummary, topSkills: ["React", "TypeScript", "Node.js"] }
      expect(summaryOutputSchema.safeParse(ok).success).toBe(true)
    })
    it("rejects more than 10 skills", () => {
      const bad = { ...validSummary, topSkills: Array.from({ length: 11 }, (_, i) => `Skill${i}`) }
      expect(summaryOutputSchema.safeParse(bad).success).toBe(false)
    })
  })

  describe("industries", () => {
    it("requires at least 1 industry", () => {
      const bad = { ...validSummary, industries: [] }
      expect(summaryOutputSchema.safeParse(bad).success).toBe(false)
    })
    it("accepts up to 6 industries", () => {
      const ok = { ...validSummary, industries: ["A", "B", "C", "D", "E", "F"] }
      expect(summaryOutputSchema.safeParse(ok).success).toBe(true)
    })
    it("rejects more than 6 industries", () => {
      const bad = { ...validSummary, industries: ["A", "B", "C", "D", "E", "F", "G"] }
      expect(summaryOutputSchema.safeParse(bad).success).toBe(false)
    })
  })

  describe("strengthsList", () => {
    it("requires at least 2 strengths", () => {
      const bad = { ...validSummary, strengthsList: ["One strength only"] }
      expect(summaryOutputSchema.safeParse(bad).success).toBe(false)
    })
    it("rejects more than 4 strengths", () => {
      const bad = { ...validSummary, strengthsList: ["A", "B", "C", "D", "E"] }
      expect(summaryOutputSchema.safeParse(bad).success).toBe(false)
    })
  })

  describe("risksList", () => {
    it("requires at least 1 risk", () => {
      const bad = { ...validSummary, risksList: [] }
      expect(summaryOutputSchema.safeParse(bad).success).toBe(false)
    })
    it("accepts 'No significant gaps identified' as a valid single risk entry", () => {
      const ok = { ...validSummary, risksList: ["No significant gaps identified"] }
      expect(summaryOutputSchema.safeParse(ok).success).toBe(true)
    })
  })

  describe("recommendationDecision", () => {
    it("accepts all four valid values", () => {
      for (const decision of RECOMMENDATION_DECISIONS) {
        const ok = { ...validSummary, recommendationDecision: decision }
        expect(summaryOutputSchema.safeParse(ok).success).toBe(true)
      }
    })
    it("rejects an invalid decision value", () => {
      const bad = { ...validSummary, recommendationDecision: "MAYBE" }
      expect(summaryOutputSchema.safeParse(bad).success).toBe(false)
    })
    it("rejects empty string", () => {
      const bad = { ...validSummary, recommendationDecision: "" }
      expect(summaryOutputSchema.safeParse(bad).success).toBe(false)
    })
  })

  describe("fitScore", () => {
    it("accepts 0", () => {
      expect(summaryOutputSchema.safeParse({ ...validSummary, fitScore: 0 }).success).toBe(true)
    })
    it("accepts 100", () => {
      expect(summaryOutputSchema.safeParse({ ...validSummary, fitScore: 100 }).success).toBe(true)
    })
    it("rejects fractional scores", () => {
      const bad = { ...validSummary, fitScore: 75.5 }
      expect(summaryOutputSchema.safeParse(bad).success).toBe(false)
    })
    it("rejects scores > 100", () => {
      expect(summaryOutputSchema.safeParse({ ...validSummary, fitScore: 101 }).success).toBe(false)
    })
    it("rejects negative scores", () => {
      expect(summaryOutputSchema.safeParse({ ...validSummary, fitScore: -1 }).success).toBe(false)
    })
  })
})

// ─── Recommendation metadata ──────────────────────────────────────────────────

describe("RECOMMENDATION_META", () => {
  it("has entries for all four decisions", () => {
    for (const decision of RECOMMENDATION_DECISIONS) {
      expect(RECOMMENDATION_META).toHaveProperty(decision)
    }
  })

  it("every entry has label, color, bg, border, description", () => {
    for (const decision of RECOMMENDATION_DECISIONS) {
      const meta = RECOMMENDATION_META[decision]
      expect(meta.label).toBeTruthy()
      expect(meta.color).toMatch(/^text-/)
      expect(meta.bg).toMatch(/^bg-/)
      expect(meta.border).toMatch(/^border-/)
      expect(meta.description.length).toBeGreaterThan(10)
    }
  })

  it("SHORTLIST has green styling", () => {
    expect(RECOMMENDATION_META.SHORTLIST.color).toContain("green")
    expect(RECOMMENDATION_META.SHORTLIST.bg).toContain("green")
  })

  it("REJECT has red styling", () => {
    expect(RECOMMENDATION_META.REJECT.color).toContain("red")
    expect(RECOMMENDATION_META.REJECT.bg).toContain("red")
  })

  it("HOLD has amber styling", () => {
    expect(RECOMMENDATION_META.HOLD.color).toContain("amber")
  })

  it("REVIEW has blue styling", () => {
    expect(RECOMMENDATION_META.REVIEW.color).toContain("blue")
  })
})

// ─── Cost estimation ──────────────────────────────────────────────────────────

describe("estimateCost", () => {
  it("calculates GPT-4o cost correctly for typical CV summary call", () => {
    // Typical: 800 prompt + 400 completion tokens
    const cost = estimateCost("gpt-4o", 800, 400)
    // Input: 800 / 1M * $2.50 = $0.002
    // Output: 400 / 1M * $10.00 = $0.004
    // Total: $0.006
    expect(cost).toBeCloseTo(0.006, 4)
  })

  it("returns 0 for 0 tokens", () => {
    expect(estimateCost("gpt-4o", 0, 0)).toBe(0)
  })

  it("returns 0 for unknown model", () => {
    expect(estimateCost("gpt-unknown", 1000, 500)).toBe(0)
  })

  it("a typical CV summary costs under $0.05", () => {
    // Worst case: 3000 prompt + 1000 completion
    const cost = estimateCost("gpt-4o", 3000, 1000)
    expect(cost).toBeLessThan(0.05)
  })
})

// ─── Token estimation ─────────────────────────────────────────────────────────

describe("estimateTokens", () => {
  it("estimates ~1 token per 4 characters", () => {
    expect(estimateTokens("abcd")).toBe(1)
    expect(estimateTokens("abcdefgh")).toBe(2)
  })

  it("rounds up partial tokens", () => {
    expect(estimateTokens("abc")).toBe(1) // 3/4 → ceil → 1
  })

  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0)
  })
})

// ─── Token truncation ─────────────────────────────────────────────────────────

describe("truncateToTokenBudget", () => {
  it("returns short text unchanged", () => {
    const text = "Hello world"
    expect(truncateToTokenBudget(text, 1000)).toBe(text)
  })

  it("truncates text exceeding the token budget", () => {
    // Budget: 10 tokens = 40 chars
    const long = "a".repeat(200)
    const result = truncateToTokenBudget(long, 10)
    expect(result.length).toBeLessThan(200)
    expect(result).toContain("[...truncated")
  })

  it("truncated result is shorter than original", () => {
    const long = "word ".repeat(1000)
    const result = truncateToTokenBudget(long, 100)
    expect(result.length).toBeLessThan(long.length)
  })
})

// ─── Profile text builder (integration-style) ─────────────────────────────────

describe("Profile text construction", () => {
  // Test the text we send to GPT-4o has the right sections

  function buildTestProfileText(overrides: Record<string, unknown> = {}): string {
    const profile = {
      fullName: "Amit Kapoor",
      currentTitle: "Senior React Developer",
      currentCompany: "Infosys",
      experienceYears: 6,
      location: "Bangalore",
      country: "IN",
      skills: ["React", "TypeScript", "Node.js"],
      domainExpertise: ["SaaS", "FinTech"],
      noticePeriodDays: 30,
      employmentType: "FULL_TIME",
      expectedSalaryMin: 1800000,
      expectedSalaryMax: 2200000,
      salaryCurrency: "INR",
      salaryPeriod: "ANNUAL",
      workAuthorization: "Indian Citizen",
      highestDegree: "B.Tech Computer Science",
      university: "IIT Bombay",
      graduationYear: 2018,
      linkedinUrl: null,
      resumeText: "Experienced developer with 6 years...",
      vendor: { name: "TalentBridge India" },
      ...overrides,
    }

    // Mirror the service's buildProfileText logic
    const lines: string[] = []
    lines.push(`SUBMITTED BY VENDOR: ${profile.vendor.name}`)
    lines.push("── IDENTITY ──")
    lines.push(`Full name:           ${profile.fullName}`)
    if (profile.currentTitle) lines.push(`Current title:       ${profile.currentTitle}`)
    if (profile.currentCompany) lines.push(`Current company:     ${profile.currentCompany}`)
    if (profile.location) lines.push(`Location:            ${profile.location}, ${profile.country}`)
    if (profile.workAuthorization) lines.push(`Work authorization:  ${profile.workAuthorization}`)
    lines.push("── SKILLS ──")
    lines.push((profile.skills as string[]).join(", "))
    lines.push("── AVAILABILITY & COMPENSATION ──")
    if (profile.noticePeriodDays !== null)
      lines.push(`Notice period:       ${profile.noticePeriodDays} days`)
    if (profile.expectedSalaryMin !== null) {
      const fmt = (n: number) => `₹${(n / 100000).toFixed(1)}L`
      lines.push(`Expected salary:     ${fmt(profile.expectedSalaryMin)} – ${fmt(profile.expectedSalaryMax!)} per annual`)
    }
    lines.push("── EDUCATION ──")
    if (profile.highestDegree) lines.push(`Degree:              ${profile.highestDegree}`)
    if (profile.university) lines.push(`Institution:         ${profile.university}`)
    if (profile.resumeText) {
      lines.push("── RESUME / CV TEXT ──")
      lines.push(profile.resumeText)
    }
    return lines.join("\n")
  }

  it("includes vendor name in profile text", () => {
    const text = buildTestProfileText()
    expect(text).toContain("TalentBridge India")
  })

  it("includes candidate full name", () => {
    const text = buildTestProfileText()
    expect(text).toContain("Amit Kapoor")
  })

  it("includes current title and company", () => {
    const text = buildTestProfileText()
    expect(text).toContain("Senior React Developer")
    expect(text).toContain("Infosys")
  })

  it("formats INR salary in lakhs", () => {
    const text = buildTestProfileText()
    expect(text).toContain("₹18.0L")
    expect(text).toContain("₹22.0L")
  })

  it("includes notice period in days", () => {
    const text = buildTestProfileText()
    expect(text).toContain("30 days")
  })

  it("includes university name", () => {
    const text = buildTestProfileText()
    expect(text).toContain("IIT Bombay")
  })

  it("includes resume text section", () => {
    const text = buildTestProfileText()
    expect(text).toContain("Experienced developer")
  })

  it("includes all skills", () => {
    const text = buildTestProfileText()
    expect(text).toContain("React")
    expect(text).toContain("TypeScript")
    expect(text).toContain("Node.js")
  })

  it("works with null optional fields", () => {
    const text = buildTestProfileText({
      currentCompany: null,
      noticePeriodDays: null,
      expectedSalaryMin: null,
      linkedinUrl: null,
      resumeText: null,
    })
    // Should not crash and should still have core fields
    expect(text).toContain("Amit Kapoor")
    expect(text).not.toContain("null")
  })
})

// ─── Fit score calibration ────────────────────────────────────────────────────

describe("Fit score calibration labels", () => {
  const getLabel = (score: number): string => {
    if (score >= 85) return "Exceptional"
    if (score >= 70) return "Strong"
    if (score >= 55) return "Qualified"
    if (score >= 40) return "Marginal"
    return "Not a fit"
  }

  it("85+ is exceptional", () => {
    expect(getLabel(85)).toBe("Exceptional")
    expect(getLabel(100)).toBe("Exceptional")
  })

  it("70–84 is strong", () => {
    expect(getLabel(70)).toBe("Strong")
    expect(getLabel(84)).toBe("Strong")
  })

  it("55–69 is qualified", () => {
    expect(getLabel(55)).toBe("Qualified")
    expect(getLabel(69)).toBe("Qualified")
  })

  it("40–54 is marginal", () => {
    expect(getLabel(40)).toBe("Marginal")
    expect(getLabel(54)).toBe("Marginal")
  })

  it("below 40 is not a fit", () => {
    expect(getLabel(39)).toBe("Not a fit")
    expect(getLabel(0)).toBe("Not a fit")
  })
})
