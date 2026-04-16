// app/api/duplicates/[alertId]/merge/route.ts
// Marks a duplicate alert as merge-requested.
// "Merging" in VendorFlow means: keep the best profile, reject the duplicate submission,
// and audit-log the decision. Full automatic field-merging is a future enhancement.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { AUDIT_ACTIONS } from "@/config/constants"

const schema = z.object({
  keepProfileId: z.string().uuid(),
  reason: z.string().max(500).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { alertId } = await params

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })

  const { keepProfileId, reason } = parsed.data

  const alert = await prisma.duplicateAlert.findUnique({
    where: { id: alertId },
    include: {
      profileA: { select: { id: true, fullName: true } },
      profileB: { select: { id: true, fullName: true } },
    },
  })

  if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 })
  if (alert.status === "REVIEWED") return NextResponse.json({ error: "Alert already resolved" }, { status: 409 })

  // Verify membership (admin only for merge)
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: alert.companyId } },
  })
  if (!membership?.isActive || membership.role !== "COMPANY_ADMIN") {
    return NextResponse.json({ error: "Only company admins can request merges" }, { status: 403 })
  }

  // Determine which profile to reject
  const rejectProfileId = keepProfileId === alert.profileAId ? alert.profileBId : alert.profileAId
  const keepName = keepProfileId === alert.profileAId ? alert.profileA.fullName : alert.profileB.fullName
  const rejectName = rejectProfileId === alert.profileAId ? alert.profileA.fullName : alert.profileB.fullName

  await prisma.$transaction([
    // Record the review decision
    prisma.duplicateReview.create({
      data: {
        alertId,
        reviewedBy: session.user.id,
        decision: "MERGE_REQUESTED",
        notes: reason ?? `Keep "${keepName}", reject "${rejectName}"`,
      },
    }),
    // Update the alert status
    prisma.duplicateAlert.update({
      where: { id: alertId },
      data: {
        status: "REVIEWED",
        mergeTargetProfileId: keepProfileId,
      },
    }),
    // Reject submissions of the duplicate profile in this company
    prisma.candidateSubmission.updateMany({
      where: { profileId: rejectProfileId, companyId: alert.companyId, status: { not: "REJECTED" } },
      data: { status: "REJECTED", rejectedReason: `Merged — same candidate as ${keepName}` },
    }),
  ])

  // Audit log
  await prisma.auditLog.create({
    data: {
      companyId: alert.companyId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: membership.role,
      action: AUDIT_ACTIONS.DUPLICATE_REVIEWED,
      entity: "DuplicateAlert",
      entityId: alertId,
      after: { decision: "MERGE_REQUESTED", keepProfileId, rejectProfileId, reason },
    },
  }).catch(console.error)

  return NextResponse.json({
    success: true,
    kept: keepName,
    rejected: rejectName,
  })
}
