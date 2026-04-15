// components/candidates/ai-summary-card.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, MapPin, Clock,
  DollarSign, Globe, Briefcase, Building2,
  Code2, TrendingUp, BookOpen, ArrowRight,
} from "lucide-react"
import { RECOMMENDATION_META, type RecommendationDecision } from "@/services/ai/cv-summary.service"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiSummaryData {
  // Structured
  headlineSummary?: string | null
  yearsOfExperience?: number | null
  topSkills?: string[]
  industries?: string[]
  employers?: string[]
  strengthsList?: string[]
  risksList?: string[]
  recommendationDecision?: string | null
  // Prose
  executiveSummary?: string | null
  keySkillsSummary?: string | null
  experienceSummary?: string | null
  domainSummary?: string | null
  strengthsSummary?: string | null
  possibleConcerns?: string | null
  workAuthSummary?: string | null
  noticePeriodSummary?: string | null
  locationSummary?: string | null
  salarySummary?: string | null
  recommendedAction?: string | null
  fitScore?: number | null
  // Metadata
  model?: string | null
  totalCost?: number | null
  generatedAt?: Date | string | null
}

interface AiSummaryCardProps {
  summary: AiSummaryData | null
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  profileId: string
  submissionId: string
  className?: string
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const size = 72
  const radius = 28
  const circ = 2 * Math.PI * radius
  const filled = circ * (Math.min(score, 100) / 100)
  const color  = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626"
  const bg     = score >= 80 ? "bg-green-50" : score >= 60 ? "bg-amber-50" : "bg-red-50"
  const label  = score >= 80 ? "Strong" : score >= 60 ? "Qualified" : "Weak"

  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl p-3 min-w-[80px]", bg)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={6} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted-foreground leading-none">/100</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  )
}

// ─── Recommendation chip ──────────────────────────────────────────────────────

function RecommendationChip({ decision }: { decision: RecommendationDecision }) {
  const meta = RECOMMENDATION_META[decision]
  const ICONS: Record<RecommendationDecision, React.ComponentType<{ className?: string }>> = {
    SHORTLIST: CheckCircle2,
    REVIEW:    TrendingUp,
    HOLD:      Clock,
    REJECT:    AlertTriangle,
  }
  const Icon = ICONS[decision]

  return (
    <div className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 border", meta.bg, meta.border)}>
      <Icon className={cn("h-4 w-4 shrink-0", meta.color)} />
      <div>
        <p className={cn("text-sm font-bold leading-none", meta.color)}>{meta.label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{meta.description}</p>
      </div>
    </div>
  )
}

// ─── Tag list ─────────────────────────────────────────────────────────────────

function TagList({
  items,
  variant = "secondary",
}: {
  items: string[]
  variant?: "secondary" | "primary" | "green" | "amber"
}) {
  if (!items?.length) return null
  const classes: Record<string, string> = {
    secondary: "bg-secondary text-foreground border-border",
    primary:   "bg-primary/10 text-primary border-primary/20",
    green:     "bg-green-50 text-green-700 border-green-200",
    amber:     "bg-amber-50 text-amber-700 border-amber-200",
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", classes[variant])}>
          {item}
        </span>
      ))}
    </div>
  )
}

// ─── Prose section ────────────────────────────────────────────────────────────

function ProseSection({
  icon: Icon,
  label,
  content,
  iconColor = "text-muted-foreground",
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  content: string | null | undefined
  iconColor?: string
  variant?: "default" | "concern" | "action"
}) {
  if (!content) return null
  const wrapperClass =
    variant === "concern" ? "bg-amber-50 border border-amber-100 rounded-xl p-4"
    : variant === "action" ? "bg-primary/[0.04] border border-primary/20 rounded-xl p-4"
    : "bg-secondary/40 rounded-xl p-4"

  return (
    <div className={wrapperClass}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", iconColor)} />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn(
        "text-sm leading-relaxed",
        variant === "action" ? "text-primary font-medium" : "text-foreground"
      )}>
        {content}
      </p>
    </div>
  )
}

// ─── Quick fact item ──────────────────────────────────────────────────────────

function FactItem({
  icon: Icon,
  label,
  value,
  iconColor = "text-muted-foreground",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | null | undefined
  iconColor?: string
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-secondary/40 p-3">
      <div className={cn("mt-0.5 shrink-0", iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm leading-snug">{value}</p>
      </div>
    </div>
  )
}

// ─── Bullet list section ──────────────────────────────────────────────────────

function BulletList({
  items,
  variant = "default",
}: {
  items: string[]
  variant?: "default" | "risk"
}) {
  if (!items?.length) return null
  const dotClass = variant === "risk" ? "bg-amber-500" : "bg-green-500"
  const wrapClass = variant === "risk"
    ? "bg-amber-50 border border-amber-100 rounded-xl p-4"
    : "bg-green-50 border border-green-100 rounded-xl p-4"

  return (
    <div className={wrapClass}>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className={cn("mt-2 h-1.5 w-1.5 rounded-full shrink-0", dotClass)} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Loading state ────────────────────────────────────────────────────────────

function SummaryLoading({ isProcessing }: { isProcessing: boolean }) {
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-semibold">AI Summary</p>
          <p className="text-xs text-muted-foreground">
            {isProcessing ? "Generating — usually takes 5–10 seconds…" : "Queued for generation"}
          </p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AiSummaryCard({
  summary,
  status,
  profileId,
  submissionId,
  className,
}: AiSummaryCardProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [isRegenerating, startRegenerate] = useTransition()

  const handleRegenerate = () => {
    startRegenerate(async () => {
      await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, submissionId }),
      })
      // Poll via router refresh after a short delay
      setTimeout(() => router.refresh(), 6000)
      router.refresh()
    })
  }

  // ── Loading / Processing ──────────────────────────────────────────────────
  if (!summary || status === "PENDING" || status === "PROCESSING") {
    return (
      <div className={className}>
        <SummaryLoading isProcessing={status === "PROCESSING"} />
      </div>
    )
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (status === "FAILED") {
    return (
      <div className={cn("rounded-2xl border border-dashed bg-card p-6", className)}>
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-semibold">AI Summary</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Summary generation failed. The candidate profile is available below.
          You can try regenerating — sometimes this happens due to transient API issues.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRegenerate}
          loading={isRegenerating}
          className="gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate summary
        </Button>
      </div>
    )
  }

  const recommendation = summary.recommendationDecision as RecommendationDecision | null
  const topSkills   = summary.topSkills   ?? []
  const industries  = summary.industries  ?? []
  const employers   = summary.employers   ?? []
  const strengths   = summary.strengthsList ?? []
  const risks       = summary.risksList     ?? []

  return (
    <div className={cn("rounded-2xl border bg-card overflow-hidden shadow-sm", className)}>

      {/* ── Card header ── */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b bg-gradient-to-r from-primary/[0.04] to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">AI Summary</p>
            {summary.model && (
              <p className="text-xs text-muted-foreground">
                {summary.model}
                {summary.totalCost && ` · $${summary.totalCost.toFixed(4)}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2.5 py-1.5 hover:bg-secondary"
            title="Regenerate AI summary"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRegenerating && "animate-spin")} />
            {isRegenerating ? "Regenerating…" : "Regenerate"}
          </button>
          {summary.fitScore !== null && summary.fitScore !== undefined && (
            <ScoreRing score={summary.fitScore} />
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Headline ── */}
        {summary.headlineSummary && (
          <p className="text-base font-semibold text-foreground leading-snug">
            {summary.headlineSummary}
          </p>
        )}

        {/* ── Recommendation chip ── */}
        {recommendation && RECOMMENDATION_META[recommendation] && (
          <RecommendationChip decision={recommendation} />
        )}

        {/* ── Quick stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {summary.yearsOfExperience !== null && summary.yearsOfExperience !== undefined && (
            <div className="flex flex-col items-center justify-center rounded-xl bg-secondary/50 py-3 px-2 text-center">
              <Briefcase className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xl font-bold tabular-nums">{summary.yearsOfExperience}</p>
              <p className="text-[10px] text-muted-foreground">years exp</p>
            </div>
          )}
          {industries.length > 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl bg-secondary/50 py-3 px-2 text-center col-span-1">
              <BookOpen className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-sm font-semibold truncate w-full px-1 text-center">
                {industries[0]}
              </p>
              {industries.length > 1 && (
                <p className="text-[10px] text-muted-foreground">+{industries.length - 1} more</p>
              )}
            </div>
          )}
          {employers.length > 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl bg-secondary/50 py-3 px-2 text-center">
              <Building2 className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-sm font-semibold truncate w-full px-1 text-center">
                {employers[0]}
              </p>
              {employers.length > 1 && (
                <p className="text-[10px] text-muted-foreground">+{employers.length - 1} more</p>
              )}
            </div>
          )}
          {summary.fitScore !== null && summary.fitScore !== undefined && (
            <div className={cn(
              "flex flex-col items-center justify-center rounded-xl py-3 px-2 text-center",
              summary.fitScore >= 80 ? "bg-green-50" : summary.fitScore >= 60 ? "bg-amber-50" : "bg-red-50"
            )}>
              <TrendingUp className={cn("h-4 w-4 mb-1",
                summary.fitScore >= 80 ? "text-green-600" : summary.fitScore >= 60 ? "text-amber-600" : "text-red-600"
              )} />
              <p className={cn("text-xl font-bold tabular-nums",
                summary.fitScore >= 80 ? "text-green-700" : summary.fitScore >= 60 ? "text-amber-700" : "text-red-700"
              )}>
                {summary.fitScore}
              </p>
              <p className="text-[10px] text-muted-foreground">fit score</p>
            </div>
          )}
        </div>

        {/* ── Top skills ── */}
        {topSkills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Skills</span>
            </div>
            <TagList items={topSkills} variant="primary" />
          </div>
        )}

        {/* ── All industries ── */}
        {industries.length > 1 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Industries</span>
            </div>
            <TagList items={industries} variant="secondary" />
          </div>
        )}

        {/* ── Executive summary ── */}
        {summary.executiveSummary && (
          <div className="rounded-xl bg-secondary/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Executive Summary</p>
            <p className="text-sm leading-relaxed">{summary.executiveSummary}</p>
          </div>
        )}

        {/* ── Strengths + Risks side by side ── */}
        <div className="grid sm:grid-cols-2 gap-3">
          {strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Strengths</span>
              </div>
              <BulletList items={strengths} variant="default" />
            </div>
          )}
          {risks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Risks / Gaps</span>
              </div>
              <BulletList items={risks} variant="risk" />
            </div>
          )}
        </div>

        {/* ── Quick facts: notice, location, salary, auth ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <FactItem icon={Clock}      label="Notice period"  value={summary.noticePeriodSummary} iconColor="text-orange-500" />
          <FactItem icon={MapPin}     label="Location"       value={summary.locationSummary}     iconColor="text-teal-500" />
          <FactItem icon={DollarSign} label="Compensation"   value={summary.salarySummary}       iconColor="text-emerald-500" />
          <FactItem icon={Globe}      label="Work auth"      value={summary.workAuthSummary}     iconColor="text-indigo-500" />
        </div>

        {/* ── Recommendation action box ── */}
        {summary.recommendedAction && (
          <div className={cn(
            "rounded-xl p-4 border",
            recommendation ? RECOMMENDATION_META[recommendation].bg : "bg-primary/[0.04]",
            recommendation ? RECOMMENDATION_META[recommendation].border : "border-primary/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className={cn("h-3.5 w-3.5", recommendation ? RECOMMENDATION_META[recommendation].color : "text-primary")} />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recommended action
              </span>
            </div>
            <p className={cn("text-sm font-medium leading-relaxed", recommendation ? RECOMMENDATION_META[recommendation].color : "text-primary")}>
              {summary.recommendedAction}
            </p>
          </div>
        )}

        {/* ── Expand / collapse detailed prose ── */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Hide detailed analysis" : "Show detailed analysis"}
        </button>

        {/* ── Expanded detail sections ── */}
        {expanded && (
          <div className="space-y-3 pt-1">
            <ProseSection
              icon={Code2}
              label="Skills Analysis"
              content={summary.keySkillsSummary}
              iconColor="text-blue-500"
            />
            <ProseSection
              icon={Briefcase}
              label="Experience"
              content={summary.experienceSummary}
              iconColor="text-purple-500"
            />
            <ProseSection
              icon={BookOpen}
              label="Domain & Industries"
              content={summary.domainSummary}
              iconColor="text-teal-500"
            />
            <ProseSection
              icon={CheckCircle2}
              label="Strengths (detailed)"
              content={summary.strengthsSummary}
              iconColor="text-green-500"
            />
            <ProseSection
              icon={AlertTriangle}
              label="Risks & Concerns"
              content={summary.possibleConcerns}
              iconColor="text-amber-500"
              variant="concern"
            />
            {employers.length > 0 && (
              <div className="rounded-xl bg-secondary/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Employment history
                  </span>
                </div>
                <TagList items={employers} variant="secondary" />
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        {summary.generatedAt && (
          <p className="text-[10px] text-muted-foreground/40 text-right pt-1">
            Generated {new Date(summary.generatedAt).toLocaleString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  )
}
