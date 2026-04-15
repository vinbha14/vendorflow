// app/api/duplicates/score/route.ts
// On-demand scoring: compare two profiles and get the full breakdown
// without creating a database alert. Used by the review UI for live scoring.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { scoreProfilePair, type ScoringProfile } from "@/services/ai/scoring-engine"

const schema = z.object({
  profileAId: z.string().uuid(),
  profileBId: z.string().uuid(),
  companyId: z.string().uuid(),
  skipEmbedding: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })

  const { profileAId, profileBId, companyId, skipEmbedding } = parsed.data

  // Verify membership
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!membership?.isActive) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [profileA, profileB] = await Promise.all([
    prisma.candidateProfile.findUnique({ where: { id: profileAId }, select: profileSelect }),
    prisma.candidateProfile.findUnique({ where: { id: profileBId }, select: profileSelect }),
  ])

  if (!profileA || !profileB) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const result = await scoreProfilePair(
    toScoringProfile(profileA),
    toScoringProfile(profileB),
    { skipEmbedding }
  )

  return NextResponse.json({ result })
}

const profileSelect = {
  id: true, fullName: true, email: true, phone: true,
  currentTitle: true, currentCompany: true, experienceYears: true,
  location: true, country: true, skills: true, domainExpertise: true,
  highestDegree: true, university: true, graduationYear: true,
  resumeText: true, rawParsedData: true,
} as const

function toScoringProfile(p: typeof profileSelect extends Record<string, true> ? never : {
  id: string; fullName: string; email: string | null; phone: string | null
  currentTitle: string | null; currentCompany: string | null; experienceYears: number | null
  location: string | null; country: string | null; skills: string[]; domainExpertise: string[]
  highestDegree: string | null; university: string | null; graduationYear: number | null
  resumeText: string | null; rawParsedData: unknown
}): ScoringProfile {
  return { ...p, rawParsedData: (p.rawParsedData as Record<string, unknown> | null) ?? null }
}
