// app/api/companies/[companyId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { AUDIT_ACTIONS } from "@/config/constants"

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")).optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { companyId } = await params

  // Verify admin access
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!membership || membership.role !== "COMPANY_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
  }

  const before = await prisma.company.findUnique({ where: { id: companyId } })
  const updated = await prisma.company.update({
    where: { id: companyId },
    data: parsed.data,
  })

  await prisma.auditLog.create({
    data: {
      companyId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: "COMPANY_ADMIN",
      action: AUDIT_ACTIONS.COMPANY_UPDATED,
      entity: "Company",
      entityId: companyId,
      before: { name: before?.name },
      after: parsed.data,
    },
  }).catch(console.error)

  return NextResponse.json({ company: updated })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { companyId } = await params

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { branding: true, subscription: { include: { plan: true } } },
  })

  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ company })
}
