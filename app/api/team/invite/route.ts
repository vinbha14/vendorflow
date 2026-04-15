// app/api/team/invite/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { INVITATION_EXPIRY_DAYS } from "@/config/constants"

const schema = z.object({
  companyId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["COMPANY_ADMIN", "HIRING_MANAGER"]),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })

  const { companyId, email, role } = parsed.data

  // Verify requester is admin
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!membership || membership.role !== "COMPANY_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Check plan limits
  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
    include: { plan: true },
  })
  const currentCount = await prisma.companyMember.count({ where: { companyId, isActive: true } })
  const maxMembers = subscription?.plan.maxTeamMembers ?? 5
  if (maxMembers !== -1 && currentCount >= maxMembers) {
    return NextResponse.json({ error: "Team member limit reached. Upgrade your plan to add more." }, { status: 400 })
  }

  // Check for existing pending invite
  const existing = await prisma.invitation.findFirst({
    where: { companyId, email, type: "TEAM_MEMBER", status: "PENDING" },
  })
  if (existing) return NextResponse.json({ error: "This email already has a pending invitation." }, { status: 400 })

  const invitation = await prisma.invitation.create({
    data: {
      companyId,
      invitedBy: session.user.id,
      email,
      type: "TEAM_MEMBER",
      role,
      status: "PENDING",
      expiresAt: new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  })

  // TODO: Send invitation email
  console.log(`[Team Invite] Token: ${invitation.token} for ${email} as ${role}`)

  return NextResponse.json({ success: true, invitationId: invitation.id })
}
