// components/billing/billing-portal-button.tsx
"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { getCustomerPortalUrl } from "@/services/billing.service"
import { cn } from "@/lib/utils"
import type { ButtonProps } from "@/components/ui/button"

interface BillingPortalButtonProps {
  companyId: string
  label?: string
  variant?: ButtonProps["variant"]
  size?: ButtonProps["size"]
  className?: string
}

export function BillingPortalButton({
  companyId,
  label = "Manage billing",
  variant = "default",
  size = "default",
  className,
}: BillingPortalButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const result = await getCustomerPortalUrl(
        companyId,
        `${window.location.origin}/dashboard/billing`
      )
      if (!result.success || !result.url) {
        setError(result.error ?? "Could not open billing portal.")
        return
      }
      window.location.href = result.url
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={variant}
        size={size}
        loading={isPending}
        onClick={handleClick}
        className={cn(className)}
      >
        {label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
