// services/ai/scoring-engine.ts
//
// Hybrid Duplicate Scoring Engine
// ────────────────────────────────
// Evaluates two candidate profiles across 10 signal categories and returns
// a confidence score (0–100), risk level, structured reasons, and a recommendation.
//
// Signal categories and their maximum weight contribution:
//
//   Layer 1 — Deterministic (hard blockers)
//   ┌─────────────────────────────────────────┬──────┐
//   │ Email exact match                       │  28  │
//   │ Phone exact match (normalised)          │  25  │
//   └─────────────────────────────────────────┴──────┘
//
//   Layer 2 — Fuzzy structural signals
//   ┌─────────────────────────────────────────┬──────┐
//   │ Full name fuzzy similarity              │  18  │
//   │ Current company similarity              │  10  │
//   │ Total experience similarity             │   5  │
//   │ Skills overlap percentage               │   8  │
//   │ Education overlap                       │   6  │
//   │ Location similarity                     │   3  │
//   └─────────────────────────────────────────┴──────┘
//
//   Layer 3 — Semantic
//   ┌─────────────────────────────────────────┬──────┐
//   │ Resume embedding cosine similarity      │  15  │
//   └─────────────────────────────────────────┴──────┘
//
//   Note: Employment history overlap is computed from rawParsedData
//   and contributes up to 8 bonus points (additive, not replacing).
//   Total possible score can exceed 100; we cap at 100.

import { openai, AI_CONFIG } from "@/lib/openai"

// ─── Public types ─────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high"

export interface SignalResult {
  /** Signal identifier */
  key: ScoringSignalKey
  /** Human-readable signal name */
  label: string
  /** Raw computed similarity for this signal (0–1 or null if not applicable) */
  similarity: number | null
  /** Points contributed to overall score */
  contribution: number
  /** Maximum possible contribution */
  maxWeight: number
  /** Whether this signal fired */
  fired: boolean
  /** Specific detail for display */
  detail: string
}

export type ScoringSignalKey =
  | "email_exact"
  | "phone_exact"
  | "phone_normalized"
  | "name_fuzzy"
  | "company_similarity"
  | "experience_similarity"
  | "skills_overlap"
  | "resume_embedding"
  | "employment_history"
  | "education_overlap"
  | "location_similarity"

export interface MatchedCandidateRef {
  profileId: string
  fullName: string
  currentTitle: string | null
  currentCompany: string | null
  vendorName: string
  submittedAt: Date
}

export interface ScoringResult {
  /** 0–100 integer confidence that these are the same person */
  confidenceScore: number
  /** low | medium | high */
  riskLevel: RiskLevel
  /** Structured signals that fired */
  signals: SignalResult[]
  /** Signal keys that contributed (for DB storage) */
  matchedFields: ScoringSignalKey[]
  /** Human-readable explanation array */
  reasons: string[]
  /** Deterministic recommendation string */
  recommendation: string
  /** Layer that drove the highest-confidence signal */
  primaryLayer: "DETERMINISTIC" | "FUZZY" | "SEMANTIC" | "NONE"
  /** Raw cosine similarity from embedding (null if not computed) */
  embeddingSimilarity: number | null
}

// ─── Profile shape required by the scorer ────────────────────────────────────

export interface ScoringProfile {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  currentTitle: string | null
  currentCompany: string | null
  experienceYears: number | null
  location: string | null
  country: string | null
  skills: string[]
  domainExpertise: string[]
  highestDegree: string | null
  university: string | null
  graduationYear: number | null
  resumeText: string | null
  rawParsedData: Record<string, unknown> | null
  // Optional pre-computed embedding — avoids re-fetching from OpenAI
  _embedding?: number[]
}

// ─── Weight table ─────────────────────────────────────────────────────────────

const WEIGHTS: Record<ScoringSignalKey, number> = {
  email_exact:           28,
  phone_exact:           22,
  phone_normalized:       5, // bonus on top of phone_exact if numbers are otherwise same
  name_fuzzy:            18,
  company_similarity:    10,
  experience_similarity:  5,
  skills_overlap:         8,
  resume_embedding:      15,
  employment_history:     8, // bonus from raw parsed data
  education_overlap:      6,
  location_similarity:    3,
}

// ─── Risk thresholds ─────────────────────────────────────────────────────────

const RISK_THRESHOLDS: Record<RiskLevel, number> = {
  low:    50, // 0–49 → low (not a duplicate)
  medium: 70, // 50–69 → medium (possible duplicate)
  high:   90, // 70–89 → high, 90+ → very high confidence
}

// ─── Utility: normalise phone numbers ────────────────────────────────────────

function normalizePhone(phone: string): string {
  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, "")
  // Strip leading country code +91 (India) or 0
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2)
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1)
  return digits
}

// ─── Utility: normalise name ─────────────────────────────────────────────────

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")                     // decompose accented chars
    .replace(/[\u0300-\u036f]/g, "")      // strip combining diacritics
    .replace(/[^a-z\s]/g, "")            // keep only letters + spaces
    .replace(/\s+/g, " ")
    .trim()
}

// ─── Utility: Levenshtein distance ───────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  // Optimised two-row DP
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array<number>(n + 1).fill(0)

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]!
          : 1 + Math.min(prev[j]!, curr[j - 1]!, prev[j - 1]!)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]!
}

function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const na = normalizeName(a)
  const nb = normalizeName(b)
  if (na === nb) return 1
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(na, nb) / maxLen
}

// ─── Utility: token overlap (Jaccard) ────────────────────────────────────────

function tokenJaccard(a: string, b: string): number {
  const tokA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean))
  const tokB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean))
  if (tokA.size === 0 && tokB.size === 0) return 1
  if (tokA.size === 0 || tokB.size === 0) return 0
  const intersection = [...tokA].filter((t) => tokB.has(t)).length
  const union = new Set([...tokA, ...tokB]).size
  return intersection / union
}

// ─── Utility: set overlap (for skills, domain expertise) ─────────────────────

function setOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a.map((s) => s.toLowerCase().trim()))
  const setB = new Set(b.map((s) => s.toLowerCase().trim()))
  const intersection = [...setA].filter((s) => setB.has(s)).length
  const union = new Set([...setA, ...setB]).size
  return intersection / union
}

// ─── Utility: cosine similarity ──────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    na  += a[i]! * a[i]!
    nb  += b[i]! * b[i]!
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

// ─── Utility: generate embedding ─────────────────────────────────────────────

export async function generateScoringEmbedding(profile: ScoringProfile): Promise<number[]> {
  if (profile._embedding?.length) return profile._embedding

  const text = [
    profile.fullName,
    profile.currentTitle,
    profile.currentCompany,
    profile.skills.join(", "),
    profile.domainExpertise.join(", "),
    profile.highestDegree,
    profile.university,
    profile.resumeText?.slice(0, 800),
  ]
    .filter(Boolean)
    .join("\n")

  const response = await openai.embeddings.create({
    model: AI_CONFIG.EMBEDDING_MODEL,
    input: text,
  })

  return response.data[0]?.embedding ?? []
}

// ─── Employment history extraction from rawParsedData ────────────────────────

interface EmploymentRecord {
  company: string
  title: string
  startYear?: number
  endYear?: number
}

function extractEmploymentHistory(profile: ScoringProfile): EmploymentRecord[] {
  if (!profile.rawParsedData) return []
  const data = profile.rawParsedData as Record<string, unknown>
  const history = data["employment"] ?? data["experience"] ?? data["workHistory"] ?? []
  if (!Array.isArray(history)) return []
  return history
    .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
    .map((e) => ({
      company: String(e["company"] ?? e["employer"] ?? ""),
      title: String(e["title"] ?? e["role"] ?? e["position"] ?? ""),
      startYear: typeof e["startYear"] === "number" ? e["startYear"] : undefined,
      endYear: typeof e["endYear"] === "number" ? e["endYear"] : undefined,
    }))
    .filter((e) => e.company.length > 0)
}

function scoreEmploymentOverlap(a: ScoringProfile, b: ScoringProfile): number {
  const histA = extractEmploymentHistory(a)
  const histB = extractEmploymentHistory(b)

  // Always add current company if available
  if (a.currentCompany) histA.unshift({ company: a.currentCompany, title: a.currentTitle ?? "" })
  if (b.currentCompany) histB.unshift({ company: b.currentCompany, title: b.currentTitle ?? "" })

  if (histA.length === 0 || histB.length === 0) return 0

  let matchScore = 0
  for (const empA of histA) {
    for (const empB of histB) {
      const companySim = stringSimilarity(empA.company, empB.company)
      if (companySim > 0.8) {
        const titleSim = stringSimilarity(empA.title, empB.title)
        const yearOverlap = computeYearOverlap(empA, empB)
        matchScore = Math.max(matchScore, companySim * 0.5 + titleSim * 0.3 + yearOverlap * 0.2)
      }
    }
  }

  return matchScore
}

function computeYearOverlap(
  a: { startYear?: number; endYear?: number },
  b: { startYear?: number; endYear?: number }
): number {
  if (!a.startYear || !b.startYear) return 0.5 // Unknown — assume possible overlap
  const aStart = a.startYear
  const aEnd = a.endYear ?? new Date().getFullYear()
  const bStart = b.startYear
  const bEnd = b.endYear ?? new Date().getFullYear()
  const overlapStart = Math.max(aStart, bStart)
  const overlapEnd = Math.min(aEnd, bEnd)
  return overlapStart <= overlapEnd ? 1.0 : 0.0
}

// ─── Education overlap ────────────────────────────────────────────────────────

function scoreEducationOverlap(a: ScoringProfile, b: ScoringProfile): number {
  const signals: number[] = []

  // University similarity
  if (a.university && b.university) {
    signals.push(stringSimilarity(a.university, b.university))
  }

  // Graduation year
  if (a.graduationYear && b.graduationYear) {
    const diff = Math.abs(a.graduationYear - b.graduationYear)
    signals.push(diff === 0 ? 1.0 : diff === 1 ? 0.7 : 0.0)
  }

  // Degree similarity
  if (a.highestDegree && b.highestDegree) {
    signals.push(tokenJaccard(a.highestDegree, b.highestDegree))
  }

  if (signals.length === 0) return 0
  return signals.reduce((sum, s) => sum + s, 0) / signals.length
}

// ─── Location similarity ──────────────────────────────────────────────────────

function scoreLocationSimilarity(a: ScoringProfile, b: ScoringProfile): number {
  const locSim: number[] = []

  if (a.country && b.country) {
    locSim.push(a.country.toLowerCase() === b.country.toLowerCase() ? 1.0 : 0.0)
  }

  if (a.location && b.location) {
    locSim.push(tokenJaccard(a.location, b.location))
  }

  if (locSim.length === 0) return 0
  return locSim.reduce((sum, s) => sum + s, 0) / locSim.length
}

// ─── Main scoring function ────────────────────────────────────────────────────

export async function scoreProfilePair(
  profileA: ScoringProfile,
  profileB: ScoringProfile,
  options: {
    skipEmbedding?: boolean
    embeddingB?: number[]
    embeddingA?: number[]
  } = {}
): Promise<ScoringResult> {
  const signals: SignalResult[] = []
  let totalScore = 0
  let primaryLayer: ScoringResult["primaryLayer"] = "NONE"
  let embeddingSimilarity: number | null = null

  // Helper to record a signal result
  function recordSignal(
    key: ScoringSignalKey,
    label: string,
    similarity: number | null,
    contribution: number,
    fired: boolean,
    detail: string
  ) {
    const maxWeight = WEIGHTS[key] ?? 0
    signals.push({ key, label, similarity, contribution, maxWeight, fired, detail })
    if (fired) totalScore += contribution
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LAYER 1 — Deterministic
  // ───────────────────────────────────────────────────────────────────────────

  // 1a. Email exact match
  if (profileA.email && profileB.email) {
    const emailA = profileA.email.toLowerCase().trim()
    const emailB = profileB.email.toLowerCase().trim()
    const match = emailA === emailB
    if (match) primaryLayer = "DETERMINISTIC"
    recordSignal(
      "email_exact",
      "Email address",
      match ? 1 : 0,
      match ? WEIGHTS.email_exact : 0,
      match,
      match ? `Identical email: ${emailA}` : `Different emails: ${emailA} vs ${emailB}`
    )
  } else {
    recordSignal("email_exact", "Email address", null, 0, false, "Email not available for one or both profiles")
  }

  // 1b. Phone exact match + normalised match
  if (profileA.phone && profileB.phone) {
    const rawMatch = profileA.phone === profileB.phone
    const normA = normalizePhone(profileA.phone)
    const normB = normalizePhone(profileB.phone)
    const normMatch = normA === normB && normA.length >= 8

    if (normMatch && primaryLayer === "NONE") primaryLayer = "DETERMINISTIC"

    recordSignal(
      "phone_exact",
      "Phone number (exact)",
      rawMatch ? 1 : 0,
      rawMatch ? WEIGHTS.phone_exact : 0,
      rawMatch,
      rawMatch ? `Identical phone: ${profileA.phone}` : "Phones differ in formatting or digits"
    )

    if (!rawMatch && normMatch) {
      recordSignal(
        "phone_normalized",
        "Phone number (normalised)",
        1,
        WEIGHTS.phone_normalized,
        true,
        `Same digits after normalisation: ${normA} (e.g. +91 prefix removed)`
      )
    } else {
      recordSignal("phone_normalized", "Phone number (normalised)", normMatch ? 1 : 0, 0, false, "")
    }
  } else {
    recordSignal("phone_exact", "Phone number (exact)", null, 0, false, "Phone not available for one or both profiles")
    recordSignal("phone_normalized", "Phone number (normalised)", null, 0, false, "")
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LAYER 2 — Fuzzy structural signals
  // ───────────────────────────────────────────────────────────────────────────

  // 2a. Full name fuzzy similarity
  {
    const sim = stringSimilarity(profileA.fullName, profileB.fullName)
    const THRESHOLD = 0.75
    const fired = sim >= THRESHOLD
    const contribution = fired ? Math.round(sim * WEIGHTS.name_fuzzy) : 0
    if (fired && primaryLayer === "NONE") primaryLayer = "FUZZY"
    recordSignal(
      "name_fuzzy",
      "Full name similarity",
      sim,
      contribution,
      fired,
      `"${profileA.fullName}" vs "${profileB.fullName}" — ${Math.round(sim * 100)}% similar`
    )
  }

  // 2b. Current company similarity
  if (profileA.currentCompany && profileB.currentCompany) {
    const sim = stringSimilarity(profileA.currentCompany, profileB.currentCompany)
    const THRESHOLD = 0.75
    const fired = sim >= THRESHOLD
    const contribution = fired ? Math.round(sim * WEIGHTS.company_similarity) : 0
    if (fired && primaryLayer === "NONE") primaryLayer = "FUZZY"
    recordSignal(
      "company_similarity",
      "Current company",
      sim,
      contribution,
      fired,
      fired
        ? `Same employer: "${profileA.currentCompany}" (${Math.round(sim * 100)}% match)`
        : `Different employers: "${profileA.currentCompany}" vs "${profileB.currentCompany}"`
    )
  } else {
    recordSignal("company_similarity", "Current company", null, 0, false, "Company not available for one or both profiles")
  }

  // 2c. Total experience similarity
  if (profileA.experienceYears !== null && profileB.experienceYears !== null) {
    const diff = Math.abs(profileA.experienceYears - profileB.experienceYears)
    // Within 1 year → very likely same person if other signals match
    const sim = diff <= 0.5 ? 1.0 : diff <= 1.5 ? 0.8 : diff <= 3 ? 0.4 : 0.0
    const fired = diff <= 1.5
    const contribution = fired ? Math.round(sim * WEIGHTS.experience_similarity) : 0
    recordSignal(
      "experience_similarity",
      "Years of experience",
      sim,
      contribution,
      fired,
      `${profileA.experienceYears}y vs ${profileB.experienceYears}y — ${diff <= 0.5 ? "identical" : `${diff.toFixed(1)} year gap`}`
    )
  } else {
    recordSignal("experience_similarity", "Years of experience", null, 0, false, "Experience years not available")
  }

  // 2d. Skills overlap
  {
    const allSkills = [...profileA.skills, ...profileA.domainExpertise]
    const allSkillsB = [...profileB.skills, ...profileB.domainExpertise]
    if (allSkills.length > 0 && allSkillsB.length > 0) {
      const sim = setOverlap(allSkills, allSkillsB)
      const THRESHOLD = 0.4
      const fired = sim >= THRESHOLD
      const contribution = fired ? Math.round(sim * WEIGHTS.skills_overlap) : 0
      if (fired && primaryLayer === "NONE") primaryLayer = "FUZZY"

      const setA = new Set(allSkills.map((s) => s.toLowerCase()))
      const setB = new Set(allSkillsB.map((s) => s.toLowerCase()))
      const shared = allSkills.filter((s) => setB.has(s.toLowerCase()))

      recordSignal(
        "skills_overlap",
        "Skills & domain overlap",
        sim,
        contribution,
        fired,
        fired
          ? `${Math.round(sim * 100)}% Jaccard overlap — shared: ${shared.slice(0, 4).join(", ")}${shared.length > 4 ? ` +${shared.length - 4} more` : ""}`
          : `${Math.round(sim * 100)}% overlap — below threshold`
      )
    } else {
      recordSignal("skills_overlap", "Skills & domain overlap", null, 0, false, "Skills not available for one or both profiles")
    }
  }

  // 2e. Education overlap
  {
    const sim = scoreEducationOverlap(profileA, profileB)
    const THRESHOLD = 0.7
    const fired = sim >= THRESHOLD
    const contribution = fired ? Math.round(sim * WEIGHTS.education_overlap) : 0
    if (fired && primaryLayer === "NONE") primaryLayer = "FUZZY"

    const parts: string[] = []
    if (profileA.university && profileB.university) {
      const uSim = stringSimilarity(profileA.university, profileB.university)
      if (uSim > 0.7) parts.push(`same institution: ${profileA.university}`)
    }
    if (profileA.graduationYear && profileB.graduationYear) {
      const diff = Math.abs(profileA.graduationYear - profileB.graduationYear)
      if (diff === 0) parts.push(`same graduation year: ${profileA.graduationYear}`)
    }
    if (profileA.highestDegree && profileB.highestDegree) {
      const dSim = tokenJaccard(profileA.highestDegree, profileB.highestDegree)
      if (dSim > 0.5) parts.push(`similar degree: ${profileA.highestDegree}`)
    }

    recordSignal(
      "education_overlap",
      "Education",
      sim,
      contribution,
      fired,
      parts.length > 0 ? parts.join("; ") : "Education details differ or unavailable"
    )
  }

  // 2f. Location similarity
  {
    const sim = scoreLocationSimilarity(profileA, profileB)
    const THRESHOLD = 0.8
    const fired = sim >= THRESHOLD
    const contribution = fired ? Math.round(sim * WEIGHTS.location_similarity) : 0
    recordSignal(
      "location_similarity",
      "Location",
      sim,
      contribution,
      fired,
      fired
        ? `Same location: ${profileA.location ?? profileA.country}`
        : `Different locations: ${profileA.location ?? "unknown"} vs ${profileB.location ?? "unknown"}`
    )
  }

  // 2g. Employment history overlap (from rawParsedData)
  {
    const sim = scoreEmploymentOverlap(profileA, profileB)
    const THRESHOLD = 0.7
    const fired = sim >= THRESHOLD
    const contribution = fired ? Math.round(sim * WEIGHTS.employment_history) : 0
    if (fired && primaryLayer === "NONE") primaryLayer = "FUZZY"

    const histA = extractEmploymentHistory(profileA)
    const histB = extractEmploymentHistory(profileB)
    const hasHistory = histA.length > 0 && histB.length > 0

    recordSignal(
      "employment_history",
      "Employment history",
      hasHistory ? sim : null,
      contribution,
      fired,
      fired
        ? `Overlapping employment records found (${Math.round(sim * 100)}% match)`
        : hasHistory
        ? "Employment histories do not overlap significantly"
        : "Structured employment history not available"
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LAYER 3 — Semantic (embedding cosine similarity)
  // ───────────────────────────────────────────────────────────────────────────

  if (!options.skipEmbedding) {
    try {
      const [embA, embB] = await Promise.all([
        options.embeddingA?.length
          ? Promise.resolve(options.embeddingA)
          : generateScoringEmbedding(profileA),
        options.embeddingB?.length
          ? Promise.resolve(options.embeddingB)
          : generateScoringEmbedding(profileB),
      ])

      if (embA.length > 0 && embB.length > 0) {
        const cos = cosineSimilarity(embA, embB)
        embeddingSimilarity = cos
        const THRESHOLD = 0.82
        const fired = cos >= THRESHOLD
        const contribution = fired ? Math.round(cos * WEIGHTS.resume_embedding) : 0
        if (fired) primaryLayer = "SEMANTIC"

        recordSignal(
          "resume_embedding",
          "Resume content (semantic)",
          cos,
          contribution,
          fired,
          fired
            ? `Resume vectors are ${Math.round(cos * 100)}% similar — very likely same person`
            : `Resume semantic similarity is ${Math.round(cos * 100)}% — below threshold`
        )
      } else {
        recordSignal("resume_embedding", "Resume content (semantic)", null, 0, false, "Could not generate resume embedding")
      }
    } catch (err) {
      console.warn("[ScoringEngine] Embedding generation failed:", err)
      recordSignal("resume_embedding", "Resume content (semantic)", null, 0, false, `Embedding failed: ${err instanceof Error ? err.message : "unknown error"}`)
    }
  } else {
    recordSignal("resume_embedding", "Resume content (semantic)", null, 0, false, "Embedding skipped")
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Final scoring
  // ───────────────────────────────────────────────────────────────────────────

  // Cap at 100
  const confidenceScore = Math.min(100, Math.round(totalScore))

  // Risk level
  const riskLevel: RiskLevel =
    confidenceScore >= RISK_THRESHOLDS.high   ? "high"
    : confidenceScore >= RISK_THRESHOLDS.medium ? "medium"
    : "low"

  // Matched fields (only fired signals)
  const matchedFields = signals.filter((s) => s.fired).map((s) => s.key)

  // Structured reasons (human-readable)
  const reasons = signals
    .filter((s) => s.fired && s.detail)
    .map((s) => s.detail)

  // Recommendation
  const recommendation = buildRecommendation(confidenceScore, riskLevel, matchedFields, primaryLayer)

  return {
    confidenceScore,
    riskLevel,
    signals,
    matchedFields,
    reasons,
    recommendation,
    primaryLayer,
    embeddingSimilarity,
  }
}

// ─── Recommendation text ─────────────────────────────────────────────────────

function buildRecommendation(
  score: number,
  risk: RiskLevel,
  matchedFields: ScoringSignalKey[],
  layer: ScoringResult["primaryLayer"]
): string {
  const hasExact = matchedFields.includes("email_exact") || matchedFields.includes("phone_exact") || matchedFields.includes("phone_normalized")
  const hasName = matchedFields.includes("name_fuzzy")
  const hasSemantic = matchedFields.includes("resume_embedding")

  if (score >= 90) {
    if (hasExact) {
      return "CONFIRM DUPLICATE — Identical contact details (email/phone) found. This is almost certainly the same person submitted by two different vendors. Reject the newer submission."
    }
    if (hasSemantic && hasName) {
      return "CONFIRM DUPLICATE — Highly similar name and resume content detected. Very likely the same person. Confirm and notify both vendors."
    }
    return "CONFIRM DUPLICATE — Multiple strong signals align. This is very likely the same candidate. Review both profiles and confirm."
  }

  if (score >= 70) {
    return "REVIEW CAREFULLY — Strong similarity signals detected. Compare both profiles side-by-side before proceeding. If confirmed, reject the newer submission and proceed with the original."
  }

  if (score >= 50) {
    return "WORTH REVIEWING — Moderate overlap detected. Could be a coincidence (common name, similar skills) or a genuine duplicate. Request additional information from vendors if unsure."
  }

  return "LIKELY NOT A DUPLICATE — Similarity score is low. No action required. This alert was generated due to borderline signals and can be safely dismissed."
}
