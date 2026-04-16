// app/api/ai/summary/route.ts
// POST /api/ai/summary
// Triggers (or re-triggers) AI summary generation for a candidate profile.
// Used by the Regenerate button on the candidate detail card.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generateCvSummary } from "@/services/ai/cv-summary.service"

const schema = z.object({
  profileId: z.string().uuid(),
  submissionId: z.string().uuid(), // Used to verify tenant membership
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
  }

  const { profileId, submissionId } = parsed.data

  // Verify submission belongs to the user's company
  const submission = await prisma.candidateSubmission.findFirst({
    where: { id: submissionId, profileId },
    include: {
      company: {
        include: {
          members: {
            where: { userId: session.user.id, isActive: true },
          },
        },
      },
    },
  })

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  if (submission.company.members.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Check for existing summary — reset it to PENDING so UI shows loading state
  await prisma.aiSummary.upsert({
    where: { profileId },
    create: { profileId, status: "PENDING" },
    update: { status: "PENDING", errorMessage: null },
  })

  // Run in background — don't await (returns immediately, client polls via page refresh)
  // In production this would be: await summarizeCvJob.trigger({ profileId })
  generateCvSummary(profileId).then((result) => {
    if (!result.success) {
      console.error("[API/Summary] Background generation failed:", result.error)
    }
  }).catch(console.error)

  return NextResponse.json({ success: true, status: "PROCESSING" })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profileId = req.nextUrl.searchParams.get("profileId")
  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 })

  const summary = await prisma.aiSummary.findUnique({
    where: { profileId },
    select: {
      status: true,
      fitScore: true,
      recommendationDecision: true,
      headlineSummary: true,
      generatedAt: true,
      errorMessage: true,
    },
  })

  return NextResponse.json({ summary })
}
