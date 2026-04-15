// components/notifications/mark-all-read-button.tsx
"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCheck } from "lucide-react"

export function MarkAllReadButton({ userId, companyId }: { userId: string; companyId: string | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, companyId }),
      })
      router.refresh()
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} loading={isPending} className="gap-2">
      <CheckCheck className="h-4 w-4" />
      Mark all read
    </Button>
  )
}
