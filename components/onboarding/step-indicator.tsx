// components/onboarding/step-indicator.tsx
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: 1, label: "Company" },
  { id: 2, label: "Branding" },
  { id: 3, label: "Subdomain" },
  { id: 4, label: "Plan" },
  { id: 5, label: "Billing" },
]

interface StepIndicatorProps {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 top-4 h-px bg-border" />
        <div
          className="absolute left-0 top-4 h-px bg-primary transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep

          return (
            <div key={step.id} className="relative flex flex-col items-center gap-2">
              {/* Circle */}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all z-10 bg-background",
                  isCompleted && "border-primary bg-primary text-white",
                  isCurrent && "border-primary text-primary",
                  !isCompleted && !isCurrent && "border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isCurrent && "text-foreground",
                  !isCurrent && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
