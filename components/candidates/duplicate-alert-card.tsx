// components/candidates/duplicate-alert-card.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle, CheckCircle2, XCircle, GitMerge, EyeOff,
  ChevronDown, ChevronUp, RefreshCw, Info,
  Mail, Phone, Briefcase, GraduationCap, MapPin,
  Code2, BookOpen, Building2, Sparkles, BarChart3,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertSeverity = "POSSIBLE" | "LIKELY" | "HIGH_CONFIDENCE"

interface SignalResult {
  key: string
  label: string
  similarity: number | null
  contribution: number
  maxWeight: number
  fired: boolean
  detail: string
}

interface ProfileSnippet {
  id: string
  fullName: string
  currentTitle: string | null
  currentCompany: string | null
  skills: string[]
  email: string | null
  phone: string | null
  experienceYears: number | null
  location: string | null
  highestDegree: string | null
  university: string | null
  graduationYear: number | null
  vendor?: { name: string }
}

interface ReviewRecord {
  decision: string
  reviewedAt: string | Date
  reviewer: { name: string | null }
  notes: string | null
}

export interface AlertData {
  id: string
  severity: AlertSeverity
  confidenceScore: number
  riskLevel: string | null
  matchedFields: string[]
  matchReason: string | null
  detectionLayer: string | null
  recommendation: string | null
  rawSignals: unknown
  profileA: ProfileSnippet
  profileB: ProfileSnippet
  reviews?: ReviewRecord[]
}

type ReviewDecision = "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE" | "MERGE_REQUESTED" | "IGNORED"
type Panel = "compare" | "signals" | "merge"

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<AlertSeverity, {
  color: string; bg: string; border: string; badgeVariant: string; label: string
}> = {
  POSSIBLE:        { color: "text-amber-700",  bg: "bg-amber-50/60",  border: "border-amber-200",  badgeVariant: "amber",  label: "Possible" },
  LIKELY:          { color: "text-orange-700", bg: "bg-orange-50/60", border: "border-orange-200", badgeVariant: "orange", label: "Likely" },
  HIGH_CONFIDENCE: { color: "text-red-700",    bg: "bg-red-50/60",    border: "border-red-300",    badgeVariant: "red",    label: "High confidence" },
}

const RISK_BADGE: Record<string, string> = {
  low:    "text-blue-700 bg-blue-50",
  medium: "text-amber-700 bg-amber-50",
  high:   "text-red-700 bg-red-50",
}

const SIGNAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email_exact:           Mail,
  phone_exact:           Phone,
  phone_normalized:      Phone,
  name_fuzzy:            CheckCircle2,
  company_similarity:    Building2,
  experience_similarity: Briefcase,
  skills_overlap:        Code2,
  resume_embedding:      Sparkles,
  employment_history:    BookOpen,
  education_overlap:     GraduationCap,
  location_similarity:   MapPin,
}

const DECISION_LABELS: Record<string, string> = {
  CONFIRMED_DUPLICATE: "Confirmed duplicate",
  NOT_DUPLICATE:       "Not a duplicate",
  MERGE_REQUESTED:     "Merge requested",
  IGNORED:             "Dismissed",
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const size = 56
  const radius = 22
  const circ = 2 * Math.PI * radius
  const filled = circ * (Math.min(score, 100) / 100)
  const color = score >= 90 ? "#ef4444" : score >= 70 ? "#f97316" : score >= 50 ? "#f59e0b" : "#3b82f6"
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-sm font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  )
}

// ─── Signal bar ───────────────────────────────────────────────────────────────

function SignalRow({ signal }: { signal: SignalResult }) {
  const Icon = SIGNAL_ICONS[signal.key] ?? Info
  const pct = signal.maxWeight > 0 ? (signal.contribution / signal.maxWeight) * 100 : 0
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0">
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5",
        signal.fired ? "bg-green-100" : signal.similarity === null ? "bg-secondary" : "bg-muted")}>
        <Icon className={cn("h-3.5 w-3.5", signal.fired ? "text-green-600" : "text-muted-foreground/50")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-xs font-medium", !signal.fired && "text-muted-foreground")}>
            {signal.label}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {signal.similarity !== null && (
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {Math.round(signal.similarity * 100)}%
              </span>
            )}
            <span className={cn("rounded-full px-1.5 py-0 text-[10px] font-semibold",
              signal.fired ? "bg-green-100 text-green-700" : signal.similarity === null ? "bg-secondary text-muted-foreground" : "bg-muted text-muted-foreground/60")}>
              {signal.fired ? `+${signal.contribution}` : signal.similarity === null ? "n/a" : "—"}
            </span>
          </div>
        </div>
        {signal.fired && signal.detail && (
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{signal.detail}</p>
        )}
        {signal.fired && signal.maxWeight > 0 && (
          <div className="mt-1.5 h-1 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Profile column ───────────────────────────────────────────────────────────

function ProfileColumn({ profile, label, isKeep }: { profile: ProfileSnippet; label: string; isKeep?: boolean }) {
  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        {isKeep !== undefined && (
          <Badge variant={isKeep ? "green" : "red"} className="text-[10px]">
            {isKeep ? "KEEP" : "REJECT"}
          </Badge>
        )}
      </div>
      <div>
        <p className="font-semibold text-sm">{profile.fullName}</p>
        <p className="text-sm text-muted-foreground">{profile.currentTitle ?? "—"}</p>
        <p className="text-xs text-muted-foreground/60">{profile.currentCompany ?? "—"}</p>
        {profile.vendor && <p className="text-[10px] text-primary mt-0.5">via {profile.vendor.name}</p>}
      </div>
      <div className="space-y-1.5 text-xs">
        {profile.email && (
          <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="font-mono break-all">{profile.email}</span></div>
        )}
        {profile.phone && (
          <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="font-mono">{profile.phone}</span></div>
        )}
        {profile.experienceYears !== null && (
          <div className="flex items-center gap-1.5"><Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
            <span>{profile.experienceYears} years exp</span></div>
        )}
        {profile.location && (
          <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <span>{profile.location}</span></div>
        )}
        {profile.university && (
          <div className="flex items-center gap-1.5"><GraduationCap className="h-3 w-3 text-muted-foreground shrink-0" />
            <span>{profile.highestDegree ? `${profile.highestDegree} · ` : ""}{profile.university}{profile.graduationYear ? ` (${profile.graduationYear})` : ""}</span>
          </div>
        )}
      </div>
      {profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {profile.skills.slice(0, 5).map((s) => (
            <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">{s}</span>
          ))}
          {profile.skills.length > 5 && (
            <span className="text-[10px] text-muted-foreground">+{profile.skills.length - 5}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DuplicateAlertCard({ alert }: { alert: AlertData }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(alert.severity === "HIGH_CONFIDENCE")
  const [panel, setPanel] = useState<Panel>("compare")
  const [isPending, startTransition] = useTransition()
  const [isRescoring, startRescore] = useTransition()
  const [reviewed, setReviewed] = useState(false)
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision | null>(null)
  const [notes, setNotes] = useState("")
  const [keepProfileId, setKeepProfileId] = useState(alert.profileA.id)

  const cfg = SEVERITY_CONFIG[alert.severity]
  const score = Math.round(alert.confidenceScore)
  const risk = alert.riskLevel ?? "medium"
  const signals = Array.isArray(alert.rawSignals) ? (alert.rawSignals as SignalResult[]) : []
  const firedSignals = signals.filter((s) => s.fired)
  const lastReview = alert.reviews?.[0]

  const doDecision = (decision: ReviewDecision) => {
    startTransition(async () => {
      const res = await fetch(`/api/duplicates/${alert.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes: notes || undefined }),
      })
      if (res.ok) { setReviewed(true); setReviewDecision(decision); router.refresh() }
    })
  }

  const doMerge = () => {
    startTransition(async () => {
      const res = await fetch(`/api/duplicates/${alert.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepProfileId, reason: notes || undefined }),
      })
      if (res.ok) { setReviewed(true); setReviewDecision("MERGE_REQUESTED"); router.refresh() }
    })
  }

  if (reviewed && reviewDecision) {
    return (
      <div className="rounded-xl border bg-muted/30 px-6 py-4 flex items-center gap-3">
        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
        <span className="text-sm font-medium">{DECISION_LABELS[reviewDecision]}</span>
        {notes && <span className="text-sm text-muted-foreground">— "{notes}"</span>}
      </div>
    )
  }

  const PANELS: { id: Panel; label: string }[] = [
    { id: "compare", label: "Side-by-side" },
    { id: "signals", label: `Signal breakdown${firedSignals.length > 0 ? ` (${firedSignals.length} fired)` : ""}` },
    { id: "merge",   label: "Merge profiles" },
  ]

  return (
    <div className={cn("rounded-xl border-2 bg-card overflow-hidden transition-shadow hover:shadow-md", cfg.border)}>
      {/* Header */}
      <div
        className={cn("flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors select-none", cfg.bg, "hover:brightness-[0.97]")}
        onClick={() => setExpanded(!expanded)}
      >
        <ScoreRing score={score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{alert.profileA.fullName}</span>
            <span className="text-muted-foreground text-xs">↔</span>
            <span className="font-semibold text-sm">{alert.profileB.fullName}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={cfg.badgeVariant as Parameters<typeof Badge>[0]["variant"]} className="text-xs">
              {cfg.label}
            </Badge>
            <span className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5 capitalize", RISK_BADGE[risk])}>
              {risk} risk
            </span>
            {alert.detectionLayer && (
              <span className="text-[10px] text-muted-foreground">{alert.detectionLayer}</span>
            )}
          </div>
        </div>
        {/* Fired signal chips (desktop) */}
        <div className="hidden lg:flex gap-1 flex-wrap max-w-[180px]">
          {firedSignals.slice(0, 3).map((s) => {
            const Icon = SIGNAL_ICONS[s.key] ?? Info
            return (
              <span key={s.key} className="flex items-center gap-1 rounded-full bg-background/80 border px-2 py-0.5 text-[10px]">
                <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                {s.label}
              </span>
            )
          })}
          {firedSignals.length > 3 && (
            <span className="text-[10px] text-muted-foreground self-center">+{firedSignals.length - 3}</span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>

      {expanded && (
        <div>
          {/* Tab bar */}
          <div className="flex border-b bg-secondary/20">
            {PANELS.map(({ id, label }) => (
              <button key={id} onClick={() => setPanel(id)}
                className={cn(
                  "px-4 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap",
                  panel === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}>
                {label}
              </button>
            ))}
            <div className="ml-auto flex items-center px-3">
              <button onClick={(e) => { e.stopPropagation(); startRescore(async () => { await fetch(`/api/duplicates/${alert.id}/rescore`, { method: "POST" }); router.refresh() }) }}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors" disabled={isRescoring}>
                <RefreshCw className={cn("h-3 w-3", isRescoring && "animate-spin")} />
                {isRescoring ? "…" : "Rescore"}
              </button>
            </div>
          </div>

          {/* Panel: Compare */}
          {panel === "compare" && (
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
              <ProfileColumn profile={alert.profileA} label="Profile A — newer submission" />
              <ProfileColumn profile={alert.profileB} label="Profile B — existing profile" />
            </div>
          )}

          {/* Panel: Signals */}
          {panel === "signals" && (
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Signal breakdown</h3>
                <span className="text-xs text-muted-foreground">
                  Score: <span className="font-bold text-foreground">{score}</span>
                  <span className="text-muted-foreground/60"> / 100</span>
                </span>
              </div>
              {/* Score bar */}
              <div>
                <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div className={cn("h-full rounded-full",
                    score >= 90 ? "bg-red-500" : score >= 70 ? "bg-orange-500" : score >= 50 ? "bg-amber-500" : "bg-blue-500")}
                    style={{ width: `${Math.min(score, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground/60">
                  <span>0</span><span>50 — medium</span><span>70 — high</span><span>90+ — very high</span>
                </div>
              </div>
              {/* Signal rows — fired first, then measured, then unavailable */}
              <div>
                {[
                  ...signals.filter(s => s.fired),
                  ...signals.filter(s => !s.fired && s.similarity !== null),
                  ...signals.filter(s => !s.fired && s.similarity === null),
                ].map(s => <SignalRow key={s.key} signal={s} />)}
                {signals.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No signal data — click Rescore to run the scoring engine.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Panel: Merge */}
          {panel === "merge" && (
            <div className="px-5 py-5 space-y-5">
              <div>
                <h3 className="text-sm font-semibold mb-1">Merge profiles</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select the profile to keep. The other profile's submissions will be rejected with a note.
                  This action is permanent and logged in the audit trail.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { profile: alert.profileA, label: "Profile A (newer)" },
                  { profile: alert.profileB, label: "Profile B (existing)" },
                ].map(({ profile, label }) => (
                  <button key={profile.id} onClick={() => setKeepProfileId(profile.id)}
                    className={cn("rounded-xl border-2 p-4 text-left transition-all",
                      keepProfileId === profile.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40")}>
                    <ProfileColumn
                      profile={profile}
                      label={label}
                      isKeep={keepProfileId === profile.id}
                    />
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Reason (optional)</label>
                <Textarea placeholder="Why keep this profile?" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="text-sm" />
              </div>
              <div className="flex gap-3">
                <Button size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700" loading={isPending} onClick={doMerge}>
                  <GitMerge className="h-3.5 w-3.5" />Confirm merge
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPanel("compare")}>Cancel</Button>
              </div>
            </div>
          )}

          {/* AI recommendation */}
          {alert.recommendation && (
            <div className="border-t px-5 py-3.5 bg-violet-50 border-violet-100">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-violet-600 mb-1">AI Recommendation</p>
                  <p className="text-xs text-violet-900 leading-relaxed">{alert.recommendation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action bar */}
          {panel !== "merge" && (
            <div className="border-t px-5 py-4 bg-muted/10 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Review notes (optional)</label>
                <Textarea placeholder="Add a note before deciding…" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="text-sm" />
              </div>
              {lastReview && (
                <p className="text-[10px] text-muted-foreground">
                  Last reviewed by {lastReview.reviewer.name ?? "unknown"}: {DECISION_LABELS[lastReview.decision] ?? lastReview.decision}
                  {lastReview.notes && ` — "${lastReview.notes}"`}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="destructive" className="gap-1.5" loading={isPending} onClick={() => doDecision("CONFIRMED_DUPLICATE")}>
                  <AlertTriangle className="h-3.5 w-3.5" />Confirm duplicate
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" loading={isPending} onClick={() => doDecision("NOT_DUPLICATE")}>
                  <XCircle className="h-3.5 w-3.5" />Not a duplicate
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-50" loading={isPending} onClick={() => setPanel("merge")}>
                  <GitMerge className="h-3.5 w-3.5" />Merge profiles
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" loading={isPending} onClick={() => doDecision("IGNORED")}>
                  <EyeOff className="h-3.5 w-3.5" />Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
