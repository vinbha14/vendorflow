// app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true, readAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
