// app/api/admin/companies/[companyId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { AUDIT_ACTIONS } from "@/config/constants"

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { companyId } = await params
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 })

  const before = await prisma.company.findUnique({ where: { id: companyId }, select: { status: true, name: true } })
  const updated = await prisma.company.update({
    where: { id: companyId },
    data: {
      status: parsed.data.status,
      ...(parsed.data.status === "DELETED" && { deletedAt: new Date() }),
    },
  })

  await prisma.auditLog.create({
    data: {
      companyId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: "SUPER_ADMIN",
      action: parsed.data.status === "SUSPENDED" ? AUDIT_ACTIONS.COMPANY_SUSPENDED : AUDIT_ACTIONS.COMPANY_UPDATED,
      entity: "Company",
      entityId: companyId,
      before: { status: before?.status },
      after: { status: parsed.data.status },
    },
  }).catch(console.error)

  return NextResponse.json({ company: updated })
}
