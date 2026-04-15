import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success-muted text-success hover:bg-success-muted/80",
        warning:
          "border-transparent bg-warning-muted text-warning hover:bg-warning-muted/80",
        danger:
          "border-transparent bg-danger-muted text-danger hover:bg-danger-muted/80",
        info:
          "border-transparent bg-info-muted text-info hover:bg-info-muted/80",
        purple:
          "border-transparent bg-purple-50 text-purple-700 hover:bg-purple-100",
        blue:
          "border-transparent bg-blue-50 text-blue-700 hover:bg-blue-100",
        amber:
          "border-transparent bg-amber-50 text-amber-700 hover:bg-amber-100",
        green:
          "border-transparent bg-green-50 text-green-700 hover:bg-green-100",
        red:
          "border-transparent bg-red-50 text-red-700 hover:bg-red-100",
        gray:
          "border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200",
        orange:
          "border-transparent bg-orange-50 text-orange-700 hover:bg-orange-100",
        teal:
          "border-transparent bg-teal-50 text-teal-700 hover:bg-teal-100",
        indigo:
          "border-transparent bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
