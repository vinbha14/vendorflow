// app/api/vendor/companies/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id, isActive: true },
  })

  if (!vendorUser) {
    return NextResponse.json({ companies: [] })
  }

  const relationships = await prisma.vendorCompany.findMany({
    where: { vendorId: vendorUser.vendorId, status: "APPROVED" },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          branding: { select: { primaryColor: true } },
        },
      },
    },
    orderBy: { approvedAt: "desc" },
  })

  const companies = relationships.map((r) => ({
    id: r.company.id,
    name: r.company.name,
    logoUrl: r.company.logoUrl,
    primaryColor: r.company.branding?.primaryColor ?? "#4F46E5",
  }))

  return NextResponse.json({ companies })
}
