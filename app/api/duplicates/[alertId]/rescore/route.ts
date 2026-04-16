// app/api/duplicates/[alertId]/rescore/route.ts
// Re-runs the scoring engine on an existing alert and updates its stored signals.
// Useful after a vendor updates a candidate's profile.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { rescoreAlert } from "@/services/ai/duplicate-detection.service"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { alertId } = await params

  const alert = await prisma.duplicateAlert.findUnique({
    where: { id: alertId },
    select: { id: true, companyId: true, status: true },
  })

  if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 })

  // Check membership
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: alert.companyId } },
  })
  if (!membership?.isActive) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (alert.status === "REVIEWED") {
    return NextResponse.json({ error: "Alert already reviewed — cannot rescore" }, { status: 409 })
  }

  await rescoreAlert(alertId)

  const updated = await prisma.duplicateAlert.findUnique({
    where: { id: alertId },
    select: { confidenceScore: true, severity: true, riskLevel: true, recommendation: true },
  })

  return NextResponse.json({ success: true, updated })
}
