// app/api/duplicates/[alertId]/review/route.ts
// Handles the four review decisions:
//   CONFIRMED_DUPLICATE → reject newer submission, notify vendors
//   NOT_DUPLICATE       → dismiss alert, clear hasDuplicateAlert flag
//   MERGE_REQUESTED     → delegate to /merge route (this handles lightweight confirm)
//   IGNORED             → mark reviewed, no further action

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { AUDIT_ACTIONS } from "@/config/constants"

const reviewSchema = z.object({
  decision: z.enum(["CONFIRMED_DUPLICATE", "NOT_DUPLICATE", "MERGE_REQUESTED", "IGNORED"]),
  notes: z.string().max(500).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { alertId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 })
  }

  const { decision, notes } = parsed.data

  // Fetch alert with both profiles
  const alert = await prisma.duplicateAlert.findUnique({
    where: { id: alertId },
    include: {
      profileA: { select: { id: true, fullName: true } },
      profileB: { select: { id: true, fullName: true } },
    },
  })

  if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 })
  if (alert.status === "REVIEWED") return NextResponse.json({ error: "Alert already reviewed" }, { status: 409 })

  // Verify membership (both admins and hiring managers can review)
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: alert.companyId } },
  })
  if (!membership?.isActive) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // ── Execute decision ──────────────────────────────────────────────────────

  await prisma.$transaction(async (tx) => {
    // 1. Record the review
    await tx.duplicateReview.create({
      data: {
        alertId,
        reviewedBy: session.user.id,
        decision,
        notes,
      },
    })

    // 2. Update the alert status
    await tx.duplicateAlert.update({
      where: { id: alertId },
      data: { status: "REVIEWED" },
    })

    // 3. Decision-specific actions
    if (decision === "CONFIRMED_DUPLICATE") {
      // Reject the newer submission (profileA) in this company
      await tx.candidateSubmission.updateMany({
        where: {
          profileId: alert.profileAId,
          companyId: alert.companyId,
          status: { not: "REJECTED" },
        },
        data: {
          status: "REJECTED",
          rejectedReason: `Confirmed duplicate of ${alert.profileB.fullName}. Submitted separately by a different vendor.`,
        },
      })
    }

    if (decision === "NOT_DUPLICATE") {
      // Clear the duplicate flag on both submissions so they show cleanly in the queue
      await tx.candidateSubmission.updateMany({
        where: {
          profileId: { in: [alert.profileAId, alert.profileBId] },
          companyId: alert.companyId,
        },
        data: { hasDuplicateAlert: false },
      })
    }
  })

  // ── Post-decision notifications ───────────────────────────────────────────

  if (decision === "CONFIRMED_DUPLICATE") {
    // Notify the vendor whose profile was rejected
    const vendorUsers = await prisma.vendorUser.findMany({
      where: { vendor: { candidates: { some: { id: alert.profileAId } } }, isActive: true },
      select: { userId: true },
    })

    await Promise.allSettled(
      vendorUsers.map((vu) =>
        prisma.notification.create({
          data: {
            userId: vu.userId,
            type: "CANDIDATE_STATUS_CHANGED",
            title: "Submission rejected — duplicate profile",
            body: `${alert.profileA.fullName}'s submission was rejected: this candidate was already in the company's pipeline.`,
            link: "/vendor/candidates",
          },
        })
      )
    )
  }

  // ── Audit log ─────────────────────────────────────────────────────────────

  await prisma.auditLog.create({
    data: {
      companyId: alert.companyId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: membership.role,
      action: AUDIT_ACTIONS.DUPLICATE_REVIEWED,
      entity: "DuplicateAlert",
      entityId: alertId,
      after: {
        decision,
        notes,
        profileA: alert.profileA.fullName,
        profileB: alert.profileB.fullName,
      },
    },
  }).catch(console.error)

  return NextResponse.json({ success: true, decision })
}
