// components/admin/admin-company-actions.tsx
"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, Eye } from "lucide-react"
import type { CompanyStatus } from "@prisma/client"

export function AdminCompanyActions({
  companyId,
  currentStatus,
}: {
  companyId: string
  currentStatus: CompanyStatus
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSuspend = () => {
    if (!confirm("Are you sure you want to suspend this company? Users will lose access immediately.")) return
    startTransition(async () => {
      await fetch(`/api/admin/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUSPENDED" }),
      })
      router.refresh()
    })
  }

  const handleReactivate = () => {
    startTransition(async () => {
      await fetch(`/api/admin/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus === "ACTIVE" ? (
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/5"
          loading={isPending}
          onClick={handleSuspend}
        >
          <AlertTriangle className="h-4 w-4" />
          Suspend
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          loading={isPending}
          onClick={handleReactivate}
        >
          <CheckCircle2 className="h-4 w-4" />
          Reactivate
        </Button>
      )}
    </div>
  )
}
