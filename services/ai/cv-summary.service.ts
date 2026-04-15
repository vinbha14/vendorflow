// services/ai/cv-summary.service.ts
//
// Generates a structured hiring manager summary for every submitted CV.
//
// Output has two tiers:
//   1. Machine-readable structured fields (arrays, enums, numbers)
//      — used to power card UI, filters, and scoring pipelines
//   2. Long-form prose fields
//      — used in the expandable detail sections of the summary card
//
// Model: GPT-4o with response_format: json_object
// Cost per profile: ~$0.015–0.025 depending on CV length
// Latency: 4–8 seconds (run in background via Trigger.dev)

import { openai, estimateCost, truncateToTokenBudget, AI_CONFIG } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// ─── Typed recommendation values ─────────────────────────────────────────────

export const RECOMMENDATION_DECISIONS = ["SHORTLIST", "REVIEW", "HOLD", "REJECT"] as const
export type RecommendationDecision = (typeof RECOMMENDATION_DECISIONS)[number]

export const RECOMMENDATION_META: Record<RecommendationDecision, {
  label: string
  color: string
  bg: string
  border: string
  description: string
}> = {
  SHORTLIST: {
    label: "Shortlist",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    description: "Strong fit — move to next round immediately",
  },
  REVIEW: {
    label: "Review",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    description: "Potential — needs human judgement before deciding",
  },
  HOLD: {
    label: "Hold",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    description: "Possibly suitable — park for a future role",
  },
  REJECT: {
    label: "Reject",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    description: "Not a fit — do not proceed with this submission",
  },
}

// ─── Zod output schema ────────────────────────────────────────────────────────
// Every field corresponds 1:1 to either a DB column or a display section.

const summaryOutputSchema = z.object({
  // ── Structured arrays + scalars ──────────────────────────────────────────
  headlineSummary: z
    .string()
    .max(180)
    .describe(
      "One crisp sentence capturing who this person is. Like a LinkedIn headline. " +
      "Example: 'Senior React developer with 6 years in SaaS and fintech, recently at Infosys.'"
    ),

  yearsOfExperience: z
    .number()
    .min(0)
    .max(50)
    .describe("Numeric years of total professional experience. Use the profile value if given; infer from resume if not."),

  topSkills: z
    .array(z.string())
    .min(3)
    .max(10)
    .describe(
      "Array of 5–8 specific skills ranked by depth of evidence. " +
      "Be concrete: 'React 18' not 'Frontend'. 'PostgreSQL' not 'Databases'. " +
      "Order most to least evidenced."
    ),

  industries: z
    .array(z.string())
    .min(1)
    .max(6)
    .describe(
      "Array of 2–4 industries or business domains this person has worked in. " +
      "Examples: ['FinTech', 'E-Commerce', 'SaaS', 'Healthcare IT']. " +
      "Infer from employer names and domain expertise if not stated."
    ),

  employers: z
    .array(z.string())
    .min(0)
    .max(8)
    .describe(
      "Clean list of current + recent employers, most recent first. " +
      "Include only company names — no dates, no titles. " +
      "Maximum 5 entries. Use 'Unknown' if the profile has no employer information."
    ),

  strengthsList: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe(
      "2–4 specific, evidence-backed strengths as brief noun phrases. " +
      "Bad: 'Good communication'. Good: 'Full-stack delivery across 3 production SaaS products'. " +
      "Reference actual details from the profile."
    ),

  risksList: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe(
      "1–3 honest concerns or gaps as brief noun phrases. " +
      "Bad: 'Limited experience'. Good: 'No cloud certifications despite 3 years of AWS usage'. " +
      "If there are no meaningful concerns, use ['No significant gaps identified']."
    ),

  recommendationDecision: z
    .enum(["SHORTLIST", "REVIEW", "HOLD", "REJECT"])
    .describe(
      "One of: SHORTLIST (proceed immediately), REVIEW (needs human call), " +
      "HOLD (park for future), REJECT (not a fit). " +
      "Be decisive. Err toward REVIEW when uncertain, not SHORTLIST."
    ),

  // ── Long-form prose ───────────────────────────────────────────────────────
  executiveSummary: z
    .string()
    .describe(
      "4–6 sentence overview for a hiring manager who will spend 30 seconds on this. " +
      "Cover: who they are, what they have built/done, where they have worked, " +
      "why they might be a good or bad fit, and what action to take. " +
      "Do not repeat the headline. Be specific — name companies, technologies, outcomes."
    ),

  keySkillsSummary: z
    .string()
    .describe(
      "2–3 sentences on technical depth. " +
      "Group skills by category (frontend, backend, infra, etc.). " +
      "Note proficiency levels where evidenced. " +
      "Call out any notable certifications or open source contributions."
    ),

  experienceSummary: z
    .string()
    .describe(
      "2–4 sentences on career trajectory. " +
      "Cover: progression, notable employers, biggest roles, gaps (if any). " +
      "Be honest about whether experience is senior, mid, or junior."
    ),

  domainSummary: z
    .string()
    .describe(
      "1–2 sentences on industry domain exposure. " +
      "Which industries? What kind of products (B2B, B2C, internal tools)? " +
      "Is there domain depth or just surface exposure?"
    ),

  strengthsSummary: z
    .string()
    .describe(
      "2–3 sentences elaborating on the top 2 strengths. " +
      "Back every claim with evidence from the CV or profile."
    ),

  possibleConcerns: z
    .string()
    .describe(
      "2–3 sentences on real risks or gaps. " +
      "Include: employment gaps, missing skills for the apparent seniority level, " +
      "salary expectations out of range, very short tenures, unusual career changes. " +
      "Do not fabricate concerns. If clean, say 'Profile appears complete and consistent.'"
    ),

  workAuthSummary: z
    .string()
    .describe(
      "1 sentence on work authorization / visa status. " +
      "Note any constraints for remote, onsite, or international roles. " +
      "If not stated, say 'Work authorization not specified in the profile.'"
    ),

  noticePeriodSummary: z
    .string()
    .describe(
      "1 sentence on availability. " +
      "Include notice period in days, any mention of immediate availability, " +
      "or buyout possibility. If not stated, say 'Notice period not specified.'"
    ),

  locationSummary: z
    .string()
    .describe(
      "1 sentence on location and remote/hybrid/onsite preference. " +
      "Include city, country, and any stated relocation willingness. " +
      "If not stated, say 'Location not specified.'"
    ),

  salarySummary: z
    .string()
    .describe(
      "1–2 sentences on compensation expectations. " +
      "For INR: state in lakhs per annum (e.g. '₹18–22L per annum'). " +
      "For USD: state annual total. " +
      "Add brief market context: 'below market', 'at market', or 'above market' for the role level. " +
      "If not stated, say 'Compensation expectations not specified.'"
    ),

  recommendedAction: z
    .string()
    .describe(
      "2–3 sentences justifying the recommendation decision. " +
      "State the decision clearly, explain WHY with 2 specific reasons, " +
      "and state the suggested next step (e.g. 'Schedule a 30-min technical screen focusing on system design')."
    ),

  fitScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "Overall fit score 0–100 based purely on profile completeness, " +
      "experience depth, skill breadth, and general hirability. " +
      "Calibration: 85–100 = exceptional, 70–84 = strong, 55–69 = qualified, " +
      "40–54 = marginal, below 40 = not a fit. " +
      "Do not inflate scores. Be honest."
    ),
})

type SummaryOutput = z.infer<typeof summaryOutputSchema>

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Principal Technical Recruiter at a top-tier technology company.
You have 15+ years of experience evaluating engineering, product, and technology candidates
across India, Southeast Asia, and globally. You are known for honest, specific, and actionable
assessments that save hiring managers time.

Your task is to analyze candidate profiles submitted by vendor recruiting agencies
and produce a structured JSON assessment.

Core principles:
1. SPECIFIC — Reference actual companies, technologies, years, and role names from the profile.
   Never say "strong background" without naming what makes it strong.

2. HONEST — Do not be a salesperson. Call out gaps, short tenures, missing skills,
   or salary mismatches. Hiring managers rely on your honesty to protect their time.

3. DECISIVE — Give a clear recommendation. If you are unsure, choose REVIEW, not SHORTLIST.
   Reserve SHORTLIST for genuinely strong candidates.

4. CALIBRATED — Fit scores are hard to earn. 85+ means this person is a standout.
   If most profiles score 80+, your calibration is off.

5. INDIA-AWARE — For Indian candidates:
   - Salary in INR: express in lakhs (L) per annum (e.g. ₹15L, ₹22L)
   - 3-4 years at one company in India is normal; don't flag it as a gap
   - IIT/IIM/BITS are premium institutions — note them
   - Common notice periods: 30, 60, or 90 days

6. STRUCTURED — Return ONLY valid JSON matching the schema. No preamble, no markdown,
   no explanation outside the JSON object.

If a field's data is absent from the profile, use a clear "Not specified" or "Unknown"
rather than inventing information.`

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateCvSummary(profileId: string): Promise<{
  success: boolean
  error?: string
}> {
  // Mark as in-flight
  await prisma.aiSummary.update({
    where: { profileId },
    data: { status: "PROCESSING" },
  })

  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { id: profileId },
      include: { vendor: { select: { name: true } } },
    })

    if (!profile) {
      await markFailed(profileId, "Profile not found")
      return { success: false, error: "Profile not found" }
    }

    const profileText = buildProfileText(profile)
    const truncated = truncateToTokenBudget(profileText, AI_CONFIG.MAX_RESUME_TOKENS)

    const userMessage = buildUserMessage(truncated, profile.fullName)

    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.SUMMARY_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.25, // Low for consistent, factual output
      max_tokens: 2000,
    })

    const rawContent = completion.choices[0]?.message?.content
    if (!rawContent) {
      await markFailed(profileId, "Empty response from AI")
      return { success: false, error: "Empty response from AI" }
    }

    let parsed: SummaryOutput
    try {
      const json = JSON.parse(rawContent)
      parsed = summaryOutputSchema.parse(json)
    } catch (err) {
      await markFailed(profileId, `Schema validation failed: ${err}`)
      return { success: false, error: "AI response did not match expected schema" }
    }

    const promptTokens    = completion.usage?.prompt_tokens    ?? 0
    const completionTokens = completion.usage?.completion_tokens ?? 0
    const totalCost = estimateCost(AI_CONFIG.SUMMARY_MODEL, promptTokens, completionTokens)

    // Save — both structured and prose fields
    await prisma.aiSummary.update({
      where: { profileId },
      data: {
        status: "COMPLETED",
        // Structured fields
        headlineSummary:       parsed.headlineSummary,
        yearsOfExperience:     parsed.yearsOfExperience,
        topSkills:             parsed.topSkills,
        industries:            parsed.industries,
        employers:             parsed.employers,
        strengthsList:         parsed.strengthsList,
        risksList:             parsed.risksList,
        recommendationDecision: parsed.recommendationDecision,
        // Prose fields
        executiveSummary:      parsed.executiveSummary,
        keySkillsSummary:      parsed.keySkillsSummary,
        experienceSummary:     parsed.experienceSummary,
        domainSummary:         parsed.domainSummary,
        strengthsSummary:      parsed.strengthsSummary,
        possibleConcerns:      parsed.possibleConcerns,
        workAuthSummary:       parsed.workAuthSummary,
        noticePeriodSummary:   parsed.noticePeriodSummary,
        locationSummary:       parsed.locationSummary,
        salarySummary:         parsed.salarySummary,
        recommendedAction:     parsed.recommendedAction,
        fitScore:              Math.round(parsed.fitScore),
        // Metadata
        model:                 AI_CONFIG.SUMMARY_MODEL,
        promptTokens,
        completionTokens,
        totalCost,
        generatedAt:           new Date(),
        errorMessage:          null,
      },
    })

    console.log(
      `[AI Summary] ✓ ${profile.fullName} | score=${parsed.fitScore} | ${parsed.recommendationDecision} | ${promptTokens + completionTokens} tokens | $${totalCost.toFixed(4)}`
    )

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    await markFailed(profileId, message)
    console.error(`[AI Summary] ✗ Profile ${profileId}:`, message)
    return { success: false, error: message }
  }
}

// ─── User message builder ─────────────────────────────────────────────────────

function buildUserMessage(profileText: string, candidateName: string): string {
  return `Analyze the following candidate profile for ${candidateName} and produce a comprehensive hiring manager summary.

${profileText}

Return a JSON object with ALL of these fields:
- headlineSummary (string, max 180 chars)
- yearsOfExperience (number)
- topSkills (string[], 5–8 items)
- industries (string[], 2–4 items)
- employers (string[], up to 5 items)
- strengthsList (string[], 2–4 items)
- risksList (string[], 1–3 items)
- recommendationDecision (one of: "SHORTLIST", "REVIEW", "HOLD", "REJECT")
- executiveSummary (string, 4–6 sentences)
- keySkillsSummary (string, 2–3 sentences)
- experienceSummary (string, 2–4 sentences)
- domainSummary (string, 1–2 sentences)
- strengthsSummary (string, 2–3 sentences)
- possibleConcerns (string, 2–3 sentences)
- workAuthSummary (string, 1 sentence)
- noticePeriodSummary (string, 1 sentence)
- locationSummary (string, 1 sentence)
- salarySummary (string, 1–2 sentences)
- recommendedAction (string, 2–3 sentences with clear next step)
- fitScore (integer 0–100)`
}

// ─── Profile text builder ─────────────────────────────────────────────────────

function buildProfileText(profile: {
  fullName: string
  currentTitle: string | null
  currentCompany: string | null
  experienceYears: number | null
  location: string | null
  country: string | null
  skills: string[]
  domainExpertise: string[]
  noticePeriodDays: number | null
  employmentType: string | null
  expectedSalaryMin: number | null
  expectedSalaryMax: number | null
  salaryCurrency: string | null
  salaryPeriod: string | null
  workAuthorization: string | null
  highestDegree: string | null
  university: string | null
  graduationYear: number | null
  linkedinUrl: string | null
  resumeText: string | null
  vendor: { name: string }
}): string {
  const lines: string[] = []

  lines.push(`SUBMITTED BY VENDOR: ${profile.vendor.name}`)
  lines.push("")

  lines.push("── IDENTITY ──")
  lines.push(`Full name:           ${profile.fullName}`)
  if (profile.currentTitle)   lines.push(`Current title:       ${profile.currentTitle}`)
  if (profile.currentCompany) lines.push(`Current company:     ${profile.currentCompany}`)
  if (profile.location || profile.country)
    lines.push(`Location:            ${[profile.location, profile.country].filter(Boolean).join(", ")}`)
  if (profile.workAuthorization)
    lines.push(`Work authorization:  ${profile.workAuthorization}`)

  lines.push("")
  lines.push("── EXPERIENCE ──")
  if (profile.experienceYears !== null)
    lines.push(`Total experience:    ${profile.experienceYears} years`)
  if (profile.employmentType)
    lines.push(`Employment type:     ${profile.employmentType.replace(/_/g, " ")}`)

  if (profile.skills.length > 0) {
    lines.push("")
    lines.push("── SKILLS ──")
    lines.push(profile.skills.join(", "))
  }

  if (profile.domainExpertise.length > 0) {
    lines.push("")
    lines.push("── DOMAIN EXPERTISE ──")
    lines.push(profile.domainExpertise.join(", "))
  }

  lines.push("")
  lines.push("── AVAILABILITY & COMPENSATION ──")
  if (profile.noticePeriodDays !== null)
    lines.push(`Notice period:       ${profile.noticePeriodDays} days`)

  if (profile.expectedSalaryMin !== null) {
    const currency = profile.salaryCurrency ?? "INR"
    const period   = (profile.salaryPeriod ?? "ANNUAL").toLowerCase()
    const min      = profile.expectedSalaryMin
    const max      = profile.expectedSalaryMax

    if (currency === "INR") {
      const fmt = (n: number) => `₹${(n / 100000).toFixed(1)}L`
      lines.push(`Expected salary:     ${fmt(min)}${max ? ` – ${fmt(max)}` : "+"} per ${period}`)
    } else {
      lines.push(
        `Expected salary:     ${currency} ${min.toLocaleString()}${max ? ` – ${max.toLocaleString()}` : "+"} per ${period}`
      )
    }
  }

  lines.push("")
  lines.push("── EDUCATION ──")
  if (profile.highestDegree)   lines.push(`Degree:              ${profile.highestDegree}`)
  if (profile.university)      lines.push(`Institution:         ${profile.university}`)
  if (profile.graduationYear)  lines.push(`Graduated:           ${profile.graduationYear}`)

  if (profile.linkedinUrl) {
    lines.push("")
    lines.push(`LinkedIn:            ${profile.linkedinUrl}`)
  }

  if (profile.resumeText) {
    lines.push("")
    lines.push("── RESUME / CV TEXT ──")
    lines.push(profile.resumeText)
  }

  return lines.join("\n")
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function markFailed(profileId: string, errorMessage: string) {
  await prisma.aiSummary
    .update({ where: { profileId }, data: { status: "FAILED", errorMessage } })
    .catch(console.error)
}
