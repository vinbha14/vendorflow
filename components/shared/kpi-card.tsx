import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: number // percentage
    direction: "up" | "down" | "neutral"
    label?: string
  }
  loading?: boolean
  className?: string
  onClick?: () => void
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  loading = false,
  className,
  onClick,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className={cn("rounded-xl border bg-card p-6", className)}>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 transition-all",
        onClick && "cursor-pointer hover:shadow-card-hover hover:border-primary/20",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <Icon className={cn("h-4.5 w-4.5", iconColor)} />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <div className="flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                trend.direction === "up" && "text-success",
                trend.direction === "down" && "text-danger",
                trend.direction === "neutral" && "text-muted-foreground"
              )}
            >
              {trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
              {trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
              {trend.direction === "neutral" && <Minus className="h-3 w-3" />}
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
