// app/api/vendor/documents/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  vendorId: z.string().uuid(),
  fileUrl: z.string().url(),
  fileName: z.string().min(1).max(255),
  docType: z.enum([
    "GST_CERTIFICATE", "PAN_CARD", "BUSINESS_REGISTRATION",
    "BANK_DETAILS", "TRADE_LICENSE", "ISO_CERTIFICATE", "OTHER",
  ]),
  companyId: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })

  // Verify user belongs to this vendor
  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id, vendorId: parsed.data.vendorId, isActive: true },
  })
  if (!vendorUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const doc = await prisma.vendorDocument.create({
    data: {
      vendorId: parsed.data.vendorId,
      companyId: parsed.data.companyId ?? null,
      fileUrl: parsed.data.fileUrl,
      fileName: parsed.data.fileName,
      docType: parsed.data.docType,
      status: "PENDING",
    },
  })

  return NextResponse.json({ document: doc })
}
