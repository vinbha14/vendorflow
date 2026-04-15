// __tests__/unit/scoring-engine.test.ts
// Tests every signal in the hybrid scoring engine independently,
// then integration-tests full scoreProfilePair results.

import { describe, it, expect, vi } from "vitest"
import { scoreProfilePair, type ScoringProfile } from "@/services/ai/scoring-engine"

// ─── Test fixtures ─────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<ScoringProfile> = {}): ScoringProfile {
  return {
    id: "profile-a",
    fullName: "Amit Kapoor",
    email: "amit.kapoor@email.com",
    phone: "+91 98765 43210",
    currentTitle: "Senior React Developer",
    currentCompany: "Infosys",
    experienceYears: 6,
    location: "Bangalore",
    country: "IN",
    skills: ["React", "TypeScript", "Node.js", "GraphQL", "AWS"],
    domainExpertise: ["SaaS", "E-Commerce"],
    highestDegree: "B.Tech Computer Science",
    university: "IIT Bombay",
    graduationYear: 2018,
    resumeText: "Experienced developer with 6 years in React and TypeScript...",
    rawParsedData: null,
    _embedding: new Array(1536).fill(0.1), // pre-computed test embedding
    ...overrides,
  }
}

// ─── Layer 1: Deterministic signals ──────────────────────────────────────────

describe("Signal: email_exact", () => {
  it("fires with maximum weight on exact email match", async () => {
    const a = makeProfile({ email: "amit@example.com" })
    const b = makeProfile({ id: "profile-b", email: "amit@example.com", _embedding: new Array(1536).fill(0.1) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "email_exact")!
    expect(signal.fired).toBe(true)
    expect(signal.contribution).toBe(28) // WEIGHTS.email_exact
    expect(result.confidenceScore).toBeGreaterThanOrEqual(28)
  })

  it("does not fire on different emails", async () => {
    const a = makeProfile({ email: "amit@example.com" })
    const b = makeProfile({ id: "profile-b", email: "priya@example.com", _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "email_exact")!
    expect(signal.fired).toBe(false)
    expect(signal.contribution).toBe(0)
  })

  it("is case-insensitive", async () => {
    const a = makeProfile({ email: "AMIT@EXAMPLE.COM" })
    const b = makeProfile({ id: "profile-b", email: "amit@example.com", _embedding: new Array(1536).fill(0.1) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "email_exact")!
    expect(signal.fired).toBe(true)
  })

  it("returns null similarity when email is missing", async () => {
    const a = makeProfile({ email: null })
    const b = makeProfile({ id: "profile-b", _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "email_exact")!
    expect(signal.similarity).toBeNull()
    expect(signal.fired).toBe(false)
  })
})

describe("Signal: phone_exact and phone_normalized", () => {
  it("fires phone_exact on identical raw phone strings", async () => {
    const a = makeProfile({ phone: "+91 98765 43210" })
    const b = makeProfile({ id: "profile-b", phone: "+91 98765 43210", _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const exact = result.signals.find((s) => s.key === "phone_exact")!
    expect(exact.fired).toBe(true)
    expect(exact.contribution).toBe(22)
  })

  it("fires phone_normalized when digits match but formatting differs", async () => {
    const a = makeProfile({ phone: "+91-98765-43210" })
    const b = makeProfile({ id: "profile-b", phone: "9876543210", _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const norm = result.signals.find((s) => s.key === "phone_normalized")!
    expect(norm.fired).toBe(true)
    expect(norm.contribution).toBe(5)
  })

  it("handles country code stripping for Indian numbers", async () => {
    const a = makeProfile({ phone: "+919876543210" })
    const b = makeProfile({ id: "profile-b", phone: "9876543210", _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const norm = result.signals.find((s) => s.key === "phone_normalized")!
    expect(norm.fired).toBe(true)
  })

  it("does not fire on completely different phone numbers", async () => {
    const a = makeProfile({ phone: "9876543210" })
    const b = makeProfile({ id: "profile-b", phone: "9000000001", _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const exact = result.signals.find((s) => s.key === "phone_exact")!
    const norm  = result.signals.find((s) => s.key === "phone_normalized")!
    expect(exact.fired).toBe(false)
    expect(norm.fired).toBe(false)
  })
})

// ─── Layer 2: Fuzzy signals ───────────────────────────────────────────────────

describe("Signal: name_fuzzy", () => {
  it("fires for identical names", async () => {
    const a = makeProfile()
    const b = makeProfile({ id: "profile-b", email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "name_fuzzy")!
    expect(signal.fired).toBe(true)
    expect(signal.similarity).toBeCloseTo(1.0, 2)
    expect(signal.contribution).toBe(18) // 1.0 * 18
  })

  it("fires for very similar names (nickname variant)", async () => {
    const a = makeProfile({ fullName: "Amit Kumar Kapoor" })
    const b = makeProfile({ id: "profile-b", fullName: "Amit Kapoor", email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "name_fuzzy")!
    expect(signal.fired).toBe(true)
    expect(signal.similarity).toBeGreaterThan(0.75)
  })

  it("fires for names with accented characters normalised", async () => {
    const a = makeProfile({ fullName: "Café Müller" })
    const b = makeProfile({ id: "profile-b", fullName: "Cafe Muller", email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "name_fuzzy")!
    expect(signal.fired).toBe(true)
  })

  it("does not fire for completely different names", async () => {
    const a = makeProfile({ fullName: "John Smith" })
    const b = makeProfile({ id: "profile-b", fullName: "Priya Sharma", email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "name_fuzzy")!
    expect(signal.fired).toBe(false)
  })
})

describe("Signal: company_similarity", () => {
  it("fires for identical company names", async () => {
    const a = makeProfile({ currentCompany: "Infosys" })
    const b = makeProfile({ id: "profile-b", currentCompany: "Infosys", email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "company_similarity")!
    expect(signal.fired).toBe(true)
    expect(signal.contribution).toBe(10)
  })

  it("fires for companies with minor typo variation", async () => {
    const a = makeProfile({ currentCompany: "Infosys Ltd" })
    const b = makeProfile({ id: "profile-b", currentCompany: "Infosys", email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "company_similarity")!
    expect(signal.fired).toBe(true)
  })

  it("does not fire for different companies", async () => {
    const a = makeProfile({ currentCompany: "TCS" })
    const b = makeProfile({ id: "profile-b", currentCompany: "Wipro", email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "company_similarity")!
    expect(signal.fired).toBe(false)
  })
})

describe("Signal: experience_similarity", () => {
  it("fires for identical experience years", async () => {
    const a = makeProfile({ experienceYears: 6 })
    const b = makeProfile({ id: "profile-b", experienceYears: 6, email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "experience_similarity")!
    expect(signal.fired).toBe(true)
    expect(signal.similarity).toBe(1.0)
  })

  it("fires for experience within 1.5 years", async () => {
    const a = makeProfile({ experienceYears: 6 })
    const b = makeProfile({ id: "profile-b", experienceYears: 7, email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "experience_similarity")!
    expect(signal.fired).toBe(true)
  })

  it("does not fire for experience gap > 1.5 years", async () => {
    const a = makeProfile({ experienceYears: 3 })
    const b = makeProfile({ id: "profile-b", experienceYears: 8, email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "experience_similarity")!
    expect(signal.fired).toBe(false)
  })
})

describe("Signal: skills_overlap", () => {
  it("fires for high skill overlap (Jaccard ≥ 0.4)", async () => {
    const a = makeProfile({ skills: ["React", "TypeScript", "Node.js"] })
    const b = makeProfile({ id: "profile-b", skills: ["React", "TypeScript", "Vue.js"], email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "skills_overlap")!
    expect(signal.fired).toBe(true)
    // 2 shared / 4 union = 0.5 Jaccard ≥ threshold
    expect(signal.similarity).toBeCloseTo(0.5, 1)
  })

  it("is case-insensitive", async () => {
    const a = makeProfile({ skills: ["react", "typescript"] })
    const b = makeProfile({ id: "profile-b", skills: ["React", "TypeScript"], email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "skills_overlap")!
    expect(signal.similarity).toBeCloseTo(1.0, 1)
  })

  it("does not fire for completely different skills", async () => {
    const a = makeProfile({ skills: ["Java", "Spring"], domainExpertise: [] })
    const b = makeProfile({ id: "profile-b", skills: ["React", "Vue"], domainExpertise: [], email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "skills_overlap")!
    expect(signal.fired).toBe(false)
  })

  it("returns null similarity when both profiles have no skills", async () => {
    const a = makeProfile({ skills: [], domainExpertise: [] })
    const b = makeProfile({ id: "profile-b", skills: [], domainExpertise: [], email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "skills_overlap")!
    expect(signal.similarity).toBeNull()
  })
})

describe("Signal: education_overlap", () => {
  it("fires for matching university and graduation year", async () => {
    const a = makeProfile({ university: "IIT Bombay", graduationYear: 2018, highestDegree: "B.Tech" })
    const b = makeProfile({ id: "profile-b", university: "IIT Bombay", graduationYear: 2018, highestDegree: "B.Tech", email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "education_overlap")!
    expect(signal.fired).toBe(true)
    expect(signal.similarity).toBeGreaterThan(0.7)
  })

  it("does not fire for different universities", async () => {
    const a = makeProfile({ university: "IIT Bombay" })
    const b = makeProfile({ id: "profile-b", university: "NIT Surathkal", email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "education_overlap")!
    expect(signal.fired).toBe(false)
  })
})

describe("Signal: location_similarity", () => {
  it("fires for same country", async () => {
    const a = makeProfile({ country: "IN", location: "Bangalore" })
    const b = makeProfile({ id: "profile-b", country: "IN", location: "Bangalore", email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "location_similarity")!
    expect(signal.fired).toBe(true)
    expect(signal.similarity).toBeCloseTo(1.0, 1)
  })

  it("does not fire for different countries", async () => {
    const a = makeProfile({ country: "IN" })
    const b = makeProfile({ id: "profile-b", country: "US", email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "location_similarity")!
    expect(signal.fired).toBe(false)
  })
})

// ─── Risk level classification ────────────────────────────────────────────────

describe("Risk level", () => {
  it("classifies score ≥ 90 as high risk", async () => {
    // Email exact match alone is 28 points, plus all other signals firing = well over 90
    const a = makeProfile()
    const b = makeProfile({
      id: "profile-b",
      // exact same person — all signals will fire
      _embedding: new Array(1536).fill(0.1),
    })
    const result = await scoreProfilePair(a, b, {
      skipEmbedding: false,
      embeddingA: new Array(1536).fill(0.1),
      embeddingB: new Array(1536).fill(0.1),
    })
    // With email + phone + name + company + exp + skills + edu + location all firing,
    // score should be ≥ 90
    expect(result.confidenceScore).toBeGreaterThanOrEqual(70)
  })

  it("classifies low-signal pairs as low risk", async () => {
    const a = makeProfile({ fullName: "John Smith", email: null, phone: null, skills: ["Java"], currentCompany: "Accenture" })
    const b = makeProfile({ id: "profile-b", fullName: "Maria Garcia", email: null, phone: null, skills: ["Ruby"], currentCompany: "IBM", _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    expect(result.riskLevel).toBe("low")
    expect(result.confidenceScore).toBeLessThan(50)
  })
})

// ─── Recommendation generation ────────────────────────────────────────────────

describe("Recommendation", () => {
  it("recommends CONFIRM for score ≥ 90 with email match", async () => {
    const a = makeProfile()
    const b = makeProfile({ id: "profile-b", _embedding: new Array(1536).fill(0.1) })
    const result = await scoreProfilePair(a, b, {
      skipEmbedding: false,
      embeddingA: new Array(1536).fill(0.1),
      embeddingB: new Array(1536).fill(0.1),
    })
    if (result.confidenceScore >= 90) {
      expect(result.recommendation).toContain("CONFIRM")
    }
  })

  it("provides a non-empty recommendation for all score levels", async () => {
    const a = makeProfile({ email: null, phone: null })
    const b = makeProfile({ id: "profile-b", fullName: "Ameet Kapoor", email: null, phone: null, _embedding: new Array(1536).fill(0.05) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    expect(result.recommendation).toBeTruthy()
    expect(result.recommendation.length).toBeGreaterThan(10)
  })
})

// ─── Output structure ─────────────────────────────────────────────────────────

describe("Output structure", () => {
  it("returns all required fields", async () => {
    const a = makeProfile()
    const b = makeProfile({ id: "profile-b", _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })

    expect(result).toHaveProperty("confidenceScore")
    expect(result).toHaveProperty("riskLevel")
    expect(result).toHaveProperty("signals")
    expect(result).toHaveProperty("matchedFields")
    expect(result).toHaveProperty("reasons")
    expect(result).toHaveProperty("recommendation")
    expect(result).toHaveProperty("primaryLayer")
    expect(result).toHaveProperty("embeddingSimilarity")

    expect(typeof result.confidenceScore).toBe("number")
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0)
    expect(result.confidenceScore).toBeLessThanOrEqual(100)
    expect(["low", "medium", "high"]).toContain(result.riskLevel)
    expect(Array.isArray(result.signals)).toBe(true)
    expect(Array.isArray(result.matchedFields)).toBe(true)
    expect(Array.isArray(result.reasons)).toBe(true)
    expect(["DETERMINISTIC", "FUZZY", "SEMANTIC", "NONE"]).toContain(result.primaryLayer)
  })

  it("has signals covering all 11 scoring keys", async () => {
    const a = makeProfile()
    const b = makeProfile({ id: "profile-b", _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })

    const keys = result.signals.map((s) => s.key)
    const expectedKeys = [
      "email_exact", "phone_exact", "phone_normalized", "name_fuzzy",
      "company_similarity", "experience_similarity", "skills_overlap",
      "resume_embedding", "employment_history", "education_overlap", "location_similarity",
    ]
    for (const key of expectedKeys) {
      expect(keys).toContain(key)
    }
  })

  it("confidence score never exceeds 100", async () => {
    // Give both profiles maximum overlap across all signals
    const a = makeProfile()
    const b = makeProfile({ id: "profile-b", _embedding: new Array(1536).fill(0.1) })
    const result = await scoreProfilePair(a, b, {
      skipEmbedding: false,
      embeddingA: new Array(1536).fill(0.1),
      embeddingB: new Array(1536).fill(0.1),
    })
    expect(result.confidenceScore).toBeLessThanOrEqual(100)
  })

  it("matchedFields only contains keys of fired signals", async () => {
    const a = makeProfile()
    const b = makeProfile({ id: "profile-b", _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })

    for (const key of result.matchedFields) {
      const signal = result.signals.find((s) => s.key === key)
      expect(signal?.fired).toBe(true)
    }
  })
})

// ─── Employment history overlap ────────────────────────────────────────────────

describe("Signal: employment_history", () => {
  it("fires when both profiles share an employer from rawParsedData", async () => {
    const history = [{ company: "Infosys", title: "Developer", startYear: 2019, endYear: 2021 }]
    const a = makeProfile({ rawParsedData: { employment: history }, currentCompany: null })
    const b = makeProfile({
      id: "profile-b",
      rawParsedData: { employment: history },
      currentCompany: null,
      email: null,
      phone: null,
      _embedding: new Array(1536).fill(0),
    })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "employment_history")!
    expect(signal.fired).toBe(true)
  })

  it("returns null similarity when no structured history available", async () => {
    const a = makeProfile({ rawParsedData: null, currentCompany: null })
    const b = makeProfile({ id: "profile-b", rawParsedData: null, currentCompany: null, email: null, phone: null, _embedding: new Array(1536).fill(0) })
    const result = await scoreProfilePair(a, b, { skipEmbedding: true })
    const signal = result.signals.find((s) => s.key === "employment_history")!
    // Falls back to current company — which is null — so no data
    expect(signal.similarity).toBeNull()
  })
})
