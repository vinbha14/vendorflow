// app/vendor/notifications/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button"
import { NotificationItem } from "@/components/notifications/notification-item"
import { Bell } from "lucide-react"

export const metadata = { title: "Notifications" }

export default async function VendorNotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        actions={
          unreadCount > 0 ? (
            <MarkAllReadButton userId={session.user.id} companyId={null} />
          ) : undefined
        }
      />
      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="Updates about your candidate submissions and company approvals will appear here."
              size="sm"
            />
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <NotificationItem key={notif.id} notification={notif} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
