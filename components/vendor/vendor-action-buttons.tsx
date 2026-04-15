// components/vendor/vendor-action-buttons.tsx
"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { approveVendor, rejectVendor } from "@/services/vendor.service"
import { CheckCircle2, XCircle } from "lucide-react"
import type { VendorCompanyStatus } from "@prisma/client"

interface VendorActionButtonsProps {
  vendorId: string
  companyId: string
  currentStatus: VendorCompanyStatus
}

export function VendorActionButtons({ vendorId, companyId, currentStatus }: VendorActionButtonsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (currentStatus === "APPROVED") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-destructive border-destructive/30 hover:bg-destructive/5"
        loading={isPending}
        onClick={() => startTransition(async () => {
          await rejectVendor(vendorId, companyId, "Suspended by admin")
          router.refresh()
        })}
      >
        <XCircle className="h-4 w-4" />
        Suspend vendor
      </Button>
    )
  }

  if (currentStatus === "PENDING") {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          loading={isPending}
          onClick={() => startTransition(async () => {
            await approveVendor(vendorId, companyId)
            router.refresh()
          })}
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive"
          loading={isPending}
          onClick={() => startTransition(async () => {
            await rejectVendor(vendorId, companyId)
            router.refresh()
          })}
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      </div>
    )
  }

  if (currentStatus === "REJECTED" || currentStatus === "SUSPENDED") {
    return (
      <Button
        size="sm"
        variant="outline"
        loading={isPending}
        onClick={() => startTransition(async () => {
          await approveVendor(vendorId, companyId)
          router.refresh()
        })}
      >
        <CheckCircle2 className="h-4 w-4" />
        Re-approve
      </Button>
    )
  }

  return null
}
