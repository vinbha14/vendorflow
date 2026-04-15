// components/candidates/candidate-status-actions.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { updateSubmissionStatus } from "@/services/candidate.service"
import type { CandidateSubmissionStatus } from "@prisma/client"
import { CheckCircle2, XCircle, Clock, Star, Trophy, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_ACTIONS: Record<string, Array<{ label: string; status: CandidateSubmissionStatus; icon: React.ComponentType<{className?: string}>; variant: "default" | "outline" | "destructive" | "secondary" | "ghost"; color?: string }>> = {
  SUBMITTED: [
    { label: "Start review", status: "UNDER_REVIEW", icon: Clock, variant: "default" },
    { label: "Reject", status: "REJECTED", icon: XCircle, variant: "destructive" },
  ],
  UNDER_REVIEW: [
    { label: "Shortlist", status: "SHORTLISTED", icon: Star, variant: "default" },
    { label: "Reject", status: "REJECTED", icon: XCircle, variant: "destructive" },
  ],
  SHORTLISTED: [
    { label: "Move to interview", status: "INTERVIEW", icon: CheckCircle2, variant: "default" },
    { label: "Reject", status: "REJECTED", icon: XCircle, variant: "destructive" },
  ],
  INTERVIEW: [
    { label: "Send offer", status: "OFFER_SENT", icon: Trophy, variant: "default" },
    { label: "Mark as hired", status: "HIRED", icon: Trophy, variant: "default" },
    { label: "Reject", status: "REJECTED", icon: XCircle, variant: "destructive" },
  ],
  OFFER_SENT: [
    { label: "Mark as hired", status: "HIRED", icon: Trophy, variant: "default" },
    { label: "Reject", status: "REJECTED", icon: XCircle, variant: "destructive" },
  ],
  HIRED: [],
  REJECTED: [
    { label: "Reconsider (back to review)", status: "UNDER_REVIEW", icon: Clock, variant: "outline" },
  ],
  WITHDRAWN: [],
}

interface CandidateStatusActionsProps {
  submissionId: string
  currentStatus: CandidateSubmissionStatus
  onStatusChange?: (newStatus: CandidateSubmissionStatus) => void
}

export function CandidateStatusActions({
  submissionId,
  currentStatus,
  onStatusChange,
}: CandidateStatusActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<CandidateSubmissionStatus | null>(null)

  const actions = STATUS_ACTIONS[currentStatus] ?? []

  if (actions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        No further actions available for this status.
      </p>
    )
  }

  const handleAction = (status: CandidateSubmissionStatus) => {
    if (status === "REJECTED") {
      setPendingStatus(status)
      setShowNotes(true)
      return
    }
    executeStatusChange(status)
  }

  const executeStatusChange = (status: CandidateSubmissionStatus) => {
    startTransition(async () => {
      const result = await updateSubmissionStatus(submissionId, status, notes || undefined)
      if (result.success) {
        onStatusChange?.(status)
        router.refresh()
        setShowNotes(false)
        setNotes("")
        setPendingStatus(null)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.status}
              variant={action.variant}
              size="sm"
              className="w-full justify-start gap-2"
              loading={isPending}
              onClick={() => handleAction(action.status)}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          )
        })}
      </div>

      {/* Rejection notes panel */}
      {showNotes && pendingStatus === "REJECTED" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-3">
          <p className="text-xs font-medium text-destructive">Rejection reason (optional)</p>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Briefly note why this candidate is being rejected..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              loading={isPending}
              onClick={() => executeStatusChange("REJECTED")}
            >
              Confirm rejection
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowNotes(false); setPendingStatus(null) }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
