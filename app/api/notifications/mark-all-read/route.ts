// app/api/notifications/mark-all-read/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const companyId = body.companyId as string | undefined

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false,
      ...(companyId ? { companyId } : {}),
    },
    data: { isRead: true, readAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
