// services/ai/duplicate-detection.service.ts
//
// Orchestrates the hybrid scoring engine across all existing profiles for a
// given company. Stores results as DuplicateAlert records and notifies reviewers.

import { prisma } from "@/lib/prisma"
import {
  scoreProfilePair,
  generateScoringEmbedding,
  type ScoringProfile,
} from "@/services/ai/scoring-engine"
import type { DuplicateAlertSeverity } from "@prisma/client"

// Minimum score to open an alert (anything below is noise)
const ALERT_THRESHOLD = 45

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function detectDuplicates(
  profileId: string,
  companyId: string
): Promise<{ alertsCreated: number; skipped: number }> {
  // Load the new profile
  const profile = await prisma.candidateProfile.findUnique({
    where: { id: profileId },
    select: profileSelect,
  })
  if (!profile) return { alertsCreated: 0, skipped: 0 }

  // All other active profiles in this company workspace
  const existingSubmissions = await prisma.candidateSubmission.findMany({
    where: {
      companyId,
      profileId: { not: profileId },
      status: { not: "WITHDRAWN" },
    },
    select: { profileId: true },
    distinct: ["profileId"],
  })
  if (existingSubmissions.length === 0) return { alertsCreated: 0, skipped: 0 }

  const existingProfiles = await prisma.candidateProfile.findMany({
    where: { id: { in: existingSubmissions.map((s) => s.profileId) } },
    select: profileSelect,
  })

  // Pre-generate embedding for the new profile once (amortises cost)
  let newEmbedding: number[] = []
  try {
    newEmbedding = await generateScoringEmbedding(toScoringProfile(profile))
  } catch {
    console.warn("[DuplicateDetection] Could not generate embedding for", profileId)
  }

  let alertsCreated = 0
  let skipped = 0

  for (const existing of existingProfiles) {
    // Skip if an alert already exists in either direction
    const alertExists = await prisma.duplicateAlert.findFirst({
      where: {
        companyId,
        OR: [
          { profileAId: profileId, profileBId: existing.id },
          { profileAId: existing.id, profileBId: profileId },
        ],
      },
      select: { id: true },
    })
    if (alertExists) { skipped++; continue }

    // Pre-generate embedding for the existing profile
    let existingEmbedding: number[] = []
    try {
      existingEmbedding = await generateScoringEmbedding(toScoringProfile(existing))
    } catch { /* embedding optional */ }

    const result = await scoreProfilePair(
      { ...toScoringProfile(profile), _embedding: newEmbedding },
      { ...toScoringProfile(existing), _embedding: existingEmbedding },
    )

    if (result.confidenceScore < ALERT_THRESHOLD) continue

    // Map 0-100 score to severity enum
    const severity: DuplicateAlertSeverity =
      result.confidenceScore >= 90 ? "HIGH_CONFIDENCE"
      : result.confidenceScore >= 70 ? "LIKELY"
      : "POSSIBLE"

    await prisma.$transaction([
      prisma.duplicateAlert.create({
        data: {
          companyId,
          profileAId: profileId,
          profileBId: existing.id,
          confidenceScore: result.confidenceScore,
          severity,
          status: "OPEN",
          matchedFields: result.matchedFields,
          matchReason: result.reasons.slice(0, 5).join(" · "),
          detectionLayer: result.primaryLayer,
          similarityScore: result.embeddingSimilarity,
          // Store the full scoring breakdown as JSON in rawSignals
          rawSignals: result.signals as unknown as import("@prisma/client").Prisma.InputJsonValue,
          recommendation: result.recommendation,
          riskLevel: result.riskLevel,
        },
      }),
      prisma.candidateSubmission.updateMany({
        where: { profileId, companyId },
        data: { hasDuplicateAlert: true },
      }),
    ])

    await notifyReviewers(companyId, profile.fullName, existing.fullName, severity, result.confidenceScore)

    alertsCreated++
    console.log(
      `[DuplicateDetection] Alert: ${profile.fullName} ↔ ${existing.fullName} | score=${result.confidenceScore} | ${severity}`
    )
  }

  return { alertsCreated, skipped }
}

// ─── Re-score an existing alert (called when profiles are updated) ────────────

export async function rescoreAlert(alertId: string): Promise<void> {
  const alert = await prisma.duplicateAlert.findUnique({
    where: { id: alertId },
    include: {
      profileA: { select: profileSelect },
      profileB: { select: profileSelect },
    },
  })
  if (!alert || alert.status === "REVIEWED") return

  const result = await scoreProfilePair(
    toScoringProfile(alert.profileA),
    toScoringProfile(alert.profileB),
  )

  const severity: DuplicateAlertSeverity =
    result.confidenceScore >= 90 ? "HIGH_CONFIDENCE"
    : result.confidenceScore >= 70 ? "LIKELY"
    : "POSSIBLE"

  await prisma.duplicateAlert.update({
    where: { id: alertId },
    data: {
      confidenceScore: result.confidenceScore,
      severity,
      matchedFields: result.matchedFields,
      matchReason: result.reasons.slice(0, 5).join(" · "),
      detectionLayer: result.primaryLayer,
      similarityScore: result.embeddingSimilarity,
      rawSignals: result.signals as unknown as import("@prisma/client").Prisma.InputJsonValue,
      recommendation: result.recommendation,
      riskLevel: result.riskLevel,
    },
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const profileSelect = {
  id: true, fullName: true, email: true, phone: true,
  currentTitle: true, currentCompany: true, experienceYears: true,
  location: true, country: true, skills: true, domainExpertise: true,
  highestDegree: true, university: true, graduationYear: true,
  resumeText: true, rawParsedData: true,
} as const

function toScoringProfile(p: {
  id: string; fullName: string; email: string | null; phone: string | null
  currentTitle: string | null; currentCompany: string | null; experienceYears: number | null
  location: string | null; country: string | null; skills: string[]; domainExpertise: string[]
  highestDegree: string | null; university: string | null; graduationYear: number | null
  resumeText: string | null; rawParsedData: unknown
}): ScoringProfile {
  return {
    ...p,
    rawParsedData: (p.rawParsedData as Record<string, unknown> | null) ?? null,
  }
}

async function notifyReviewers(
  companyId: string,
  nameA: string,
  nameB: string,
  severity: DuplicateAlertSeverity,
  score: number
) {
  const members = await prisma.companyMember.findMany({
    where: { companyId, isActive: true },
    select: { userId: true },
  })

  const title =
    severity === "HIGH_CONFIDENCE"
      ? "⚠️ High confidence duplicate detected"
      : severity === "LIKELY"
      ? "Likely duplicate detected"
      : "Possible duplicate detected"

  await Promise.allSettled(
    members.map((m) =>
      prisma.notification.create({
        data: {
          userId: m.userId,
          companyId,
          type: "DUPLICATE_DETECTED",
          title,
          body: `${nameA} and ${nameB} may be the same candidate (${score}% confidence). Review in the duplicate queue.`,
          link: "/dashboard/duplicates",
        },
      })
    )
  )
}
