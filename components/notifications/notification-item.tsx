// components/notifications/notification-item.tsx
"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn, formatRelativeDate } from "@/lib/utils"
import {
  Bell, AlertTriangle, UserCheck, Building2,
  CreditCard, CheckCircle2, Info,
} from "lucide-react"
import type { Notification } from "@prisma/client"

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  DUPLICATE_DETECTED:    { icon: AlertTriangle, color: "text-amber-500 bg-amber-50" },
  SUBMISSION_RECEIVED:   { icon: UserCheck,     color: "text-blue-500 bg-blue-50" },
  CANDIDATE_SHORTLISTED: { icon: CheckCircle2,  color: "text-green-500 bg-green-50" },
  CANDIDATE_REJECTED:    { icon: UserCheck,     color: "text-red-500 bg-red-50" },
  VENDOR_APPROVED:       { icon: Building2,     color: "text-green-500 bg-green-50" },
  VENDOR_PENDING:        { icon: Building2,     color: "text-amber-500 bg-amber-50" },
  BILLING_PAYMENT_FAILED:{ icon: CreditCard,    color: "text-red-500 bg-red-50" },
  BILLING_TRIAL_ENDING:  { icon: CreditCard,    color: "text-amber-500 bg-amber-50" },
  DEFAULT:               { icon: Bell,          color: "text-muted-foreground bg-secondary" },
}

export function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG["DEFAULT"]!
  const Icon = config.icon

  const handleClick = () => {
    startTransition(async () => {
      if (!notification.isRead) {
        await fetch(`/api/notifications/${notification.id}/read`, { method: "POST" })
      }
      if (notification.link) {
        router.push(notification.link)
        router.refresh()
      }
    })
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-muted/40 transition-colors",
        !notification.isRead && "bg-primary/[0.02]"
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5", config.color.split(" ")[1])}>
        <Icon className={cn("h-4 w-4", config.color.split(" ")[0])} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm", !notification.isRead ? "font-semibold" : "font-medium")}>{notification.title}</p>
          {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5">{formatRelativeDate(new Date(notification.createdAt))}</p>
      </div>
    </div>
  )
}
