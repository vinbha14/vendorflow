import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 pb-6", className)}>
      <div className="min-w-0 flex-1">
        {breadcrumb && (
          <div className="mb-1.5 text-xs text-muted-foreground">
            {breadcrumb}
          </div>
        )}
        <h1 className="text-xl font-semibold text-foreground truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
