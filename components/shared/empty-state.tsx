import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
  }
  className?: string
  size?: "sm" | "default" | "lg"
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "default",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" && "py-8 px-4",
        size === "default" && "py-16 px-6",
        size === "lg" && "py-24 px-6",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-muted mb-5",
          size === "sm" ? "w-12 h-12" : "w-16 h-16"
        )}
      >
        <Icon
          className={cn(
            "text-muted-foreground",
            size === "sm" ? "w-5 h-5" : "w-8 h-8"
          )}
        />
      </div>
      <h3
        className={cn(
          "font-semibold text-foreground mb-1",
          size === "sm" ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-muted-foreground max-w-sm",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {secondaryAction && (
            <Button
              variant="outline"
              size={size === "sm" ? "sm" : "default"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button
              size={size === "sm" ? "sm" : "default"}
              onClick={action.onClick}
              asChild={!!action.href}
            >
              {action.href ? (
                <a href={action.href}>{action.label}</a>
              ) : (
                action.label
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
