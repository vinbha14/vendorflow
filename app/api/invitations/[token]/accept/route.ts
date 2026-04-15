// app/api/invitations/[token]/accept/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ROUTES } from "@/config/constants"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const session = await auth()

  if (!session?.user) {
    return NextResponse.redirect(
      new URL(`${ROUTES.SIGN_IN}?invitation=${token}`, req.url)
    )
  }

  // Find invitation
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { company: { select: { id: true, name: true, slug: true } } },
  })

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    return NextResponse.redirect(
      new URL(`${ROUTES.SIGN_IN}?error=InvalidInvitation`, req.url)
    )
  }

  if (invitation.type === "VENDOR") {
    // Create or find vendor for this user
    let vendor = await prisma.vendor.findUnique({ where: { email: session.user.email } })

    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          name: invitation.vendorName ?? session.user.name ?? "Unnamed Vendor",
          email: session.user.email,
          status: "PENDING",
        },
      })
    }

    // Create VendorUser association
    await prisma.vendorUser.upsert({
      where: { userId_vendorId: { userId: session.user.id, vendorId: vendor.id } },
      update: {},
      create: {
        userId: session.user.id,
        vendorId: vendor.id,
        role: "ADMIN",
        isActive: true,
      },
    })

    // Create VendorCompany relationship (pending approval)
    await prisma.vendorCompany.upsert({
      where: { vendorId_companyId: { vendorId: vendor.id, companyId: invitation.companyId } },
      update: {},
      create: {
        vendorId: vendor.id,
        companyId: invitation.companyId,
        status: "PENDING",
      },
    })
  } else if (invitation.type === "TEAM_MEMBER") {
    // Add user as company member
    await prisma.companyMember.upsert({
      where: {
        userId_companyId: { userId: session.user.id, companyId: invitation.companyId },
      },
      update: { isActive: true, role: invitation.role as "COMPANY_ADMIN" | "HIRING_MANAGER" },
      create: {
        userId: session.user.id,
        companyId: invitation.companyId,
        role: (invitation.role as "COMPANY_ADMIN" | "HIRING_MANAGER") ?? "HIRING_MANAGER",
        invitedBy: invitation.invitedBy,
        isActive: true,
      },
    })
  }

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { token },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  })

  // Redirect to appropriate dashboard
  const redirectPath =
    invitation.type === "VENDOR" ? ROUTES.VENDOR : ROUTES.DASHBOARD

  return NextResponse.redirect(new URL(redirectPath, req.url))
}
