// services/vendor.service.ts
"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { AUDIT_ACTIONS, INVITATION_EXPIRY_DAYS } from "@/config/constants"
import { headers } from "next/headers"
import { z } from "zod"

const inviteSchema = z.object({
  email: z.string().email(),
  vendorName: z.string().min(2).max(100),
  message: z.string().max(500).optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Invite a vendor by email
// ─────────────────────────────────────────────────────────────────────────────
export async function inviteVendor(
  rawInput: z.infer<typeof inviteSchema>
): Promise<{ success: boolean; invitationId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const parsed = inviteSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { email, vendorName, message } = parsed.data

  // Get user's company
  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.user.id, isActive: true, role: "COMPANY_ADMIN" },
  })
  if (!membership) return { success: false, error: "Unauthorized — admin access required" }

  // Check if already invited / approved
  const existing = await prisma.invitation.findFirst({
    where: {
      companyId: membership.companyId,
      email,
      type: "VENDOR",
      status: "PENDING",
    },
  })
  if (existing) {
    return { success: false, error: "This vendor has already been invited and has a pending invitation." }
  }

  // Create invitation
  const invitation = await prisma.invitation.create({
    data: {
      companyId: membership.companyId,
      invitedBy: session.user.id,
      email,
      type: "VENDOR",
      vendorName,
      message,
      status: "PENDING",
      expiresAt: new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
    include: { company: { select: { name: true } } },
  })

  // TODO: Send invitation email via Resend
  // await sendVendorInvitationEmail({
  //   to: email,
  //   vendorName,
  //   companyName: invitation.company.name,
  //   inviteUrl: buildPlatformUrl(`/portal/${invitation.company.slug}/join/${invitation.token}`),
  //   message,
  // })

  console.log(
    `[Vendor Invite] Token: ${invitation.token} | URL: /portal/join/${invitation.token}`
  )

  // Audit log
  await prisma.auditLog.create({
    data: {
      companyId: membership.companyId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: "COMPANY_ADMIN",
      action: AUDIT_ACTIONS.VENDOR_INVITED,
      entity: "Invitation",
      entityId: invitation.id,
      after: { email, vendorName },
      ipAddress: await getClientIp(),
    },
  })

  return { success: true, invitationId: invitation.id }
}

// ─────────────────────────────────────────────────────────────────────────────
// Approve a vendor for a company
// ─────────────────────────────────────────────────────────────────────────────
export async function approveVendor(
  vendorId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  // Verify requester is admin of this company
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!membership || membership.role !== "COMPANY_ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  const before = await prisma.vendorCompany.findUnique({
    where: { vendorId_companyId: { vendorId, companyId } },
  })

  await prisma.vendorCompany.update({
    where: { vendorId_companyId: { vendorId, companyId } },
    data: {
      status: "APPROVED",
      approvedBy: session.user.id,
      approvedAt: new Date(),
    },
  })

  // Notify vendor
  const vendorUsers = await prisma.vendorUser.findMany({
    where: { vendorId },
    select: { userId: true },
  })
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } })
  await Promise.all(
    vendorUsers.map((vu) =>
      prisma.notification.create({
        data: {
          userId: vu.userId,
          type: "VENDOR_APPROVED",
          title: "Vendor application approved",
          body: `Your vendor account has been approved by ${company?.name}. You can now submit candidates.`,
          link: "/vendor",
        },
      }).catch(() => {})
    )
  )

  await prisma.auditLog.create({
    data: {
      companyId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: "COMPANY_ADMIN",
      action: AUDIT_ACTIONS.VENDOR_APPROVED,
      entity: "VendorCompany",
      entityId: `${vendorId}-${companyId}`,
      before: { status: before?.status },
      after: { status: "APPROVED" },
      ipAddress: await getClientIp(),
    },
  })

  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reject a vendor
// ─────────────────────────────────────────────────────────────────────────────
export async function rejectVendor(
  vendorId: string,
  companyId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!membership || membership.role !== "COMPANY_ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  await prisma.vendorCompany.update({
    where: { vendorId_companyId: { vendorId, companyId } },
    data: { status: "REJECTED", rejectedReason: reason },
  })

  await prisma.auditLog.create({
    data: {
      companyId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: "COMPANY_ADMIN",
      action: AUDIT_ACTIONS.VENDOR_REJECTED,
      entity: "VendorCompany",
      entityId: `${vendorId}-${companyId}`,
      after: { status: "REJECTED", reason },
      ipAddress: await getClientIp(),
    },
  })

  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Get invitation by token (for vendor acceptance flow)
// ─────────────────────────────────────────────────────────────────────────────
export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      company: {
        include: {
          branding: true,
        },
      },
    },
  })

  if (!invitation) return null
  if (invitation.status !== "PENDING") return null
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { token }, data: { status: "EXPIRED" } })
    return null
  }

  return invitation
}

async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  )
}
