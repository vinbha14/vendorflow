// app/api/vendor/profile/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")).optional(),
  description: z.string().max(1000).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
})

async function getVendorUser(userId: string) {
  return prisma.vendorUser.findFirst({
    where: { userId, isActive: true },
    include: { vendor: true },
  })
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const vendorUser = await getVendorUser(session.user.id)
  if (!vendorUser) return NextResponse.json({ vendor: null })

  return NextResponse.json({ vendor: vendorUser.vendor })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const vendorUser = await getVendorUser(session.user.id)
  if (!vendorUser) return NextResponse.json({ error: "Not a vendor user" }, { status: 403 })

  if (vendorUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Only vendor admins can update profile" }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })

  const updated = await prisma.vendor.update({
    where: { id: vendorUser.vendorId },
    data: parsed.data,
  })

  return NextResponse.json({ vendor: updated })
}
