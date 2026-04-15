import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  VENDOR_STATUS_LABELS,
  SUBMISSION_STATUS_LABELS,
  DUPLICATE_SEVERITY_LABELS,
} from "@/config/constants"

type StatusType = "vendor" | "submission" | "duplicate" | "subscription"

const VENDOR_BADGE_VARIANTS: Record<string, string> = {
  INVITED: "blue",
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  SUSPENDED: "orange",
}

const SUBMISSION_BADGE_VARIANTS: Record<string, string> = {
  SUBMITTED: "blue",
  UNDER_REVIEW: "amber",
  SHORTLISTED: "purple",
  INTERVIEW: "indigo",
  OFFER_SENT: "teal",
  REJECTED: "red",
  HIRED: "green",
  WITHDRAWN: "gray",
}

const DUPLICATE_BADGE_VARIANTS: Record<string, string> = {
  POSSIBLE: "amber",
  LIKELY: "orange",
  HIGH_CONFIDENCE: "red",
}

const SUBSCRIPTION_BADGE_VARIANTS: Record<string, string> = {
  TRIALING: "blue",
  ACTIVE: "green",
  PAST_DUE: "red",
  CANCELED: "gray",
  INCOMPLETE: "amber",
  PAUSED: "orange",
  UNPAID: "red",
}

interface StatusBadgeProps {
  status: string
  type: StatusType
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, type, showDot = false, className }: StatusBadgeProps) {
  let label = status
  let variant = "gray"

  switch (type) {
    case "vendor":
      label = VENDOR_STATUS_LABELS[status] ?? status
      variant = VENDOR_BADGE_VARIANTS[status] ?? "gray"
      break
    case "submission":
      label = SUBMISSION_STATUS_LABELS[status] ?? status
      variant = SUBMISSION_BADGE_VARIANTS[status] ?? "gray"
      break
    case "duplicate":
      label = DUPLICATE_SEVERITY_LABELS[status] ?? status
      variant = DUPLICATE_BADGE_VARIANTS[status] ?? "gray"
      break
    case "subscription":
      label = status.charAt(0) + status.slice(1).toLowerCase()
      variant = SUBSCRIPTION_BADGE_VARIANTS[status] ?? "gray"
      break
  }

  const dotColors: Record<string, string> = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    gray: "bg-gray-400",
    indigo: "bg-indigo-500",
    teal: "bg-teal-500",
  }

  return (
    <Badge
      variant={variant as Parameters<typeof Badge>[0]["variant"]}
      className={cn("gap-1.5", className)}
    >
      {showDot && (
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full", dotColors[variant] ?? "bg-gray-400")}
        />
      )}
      {label}
    </Badge>
  )
}
