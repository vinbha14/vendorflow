// app/onboarding/branding/page.tsx
"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRight, ArrowLeft, Palette, Eye, Zap, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { saveCompanyBranding } from "@/services/company.service"
import { ROUTES } from "@/config/constants"
import { cn } from "@/lib/utils"

const schema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  tagline: z.string().max(120).optional(),
  description: z.string().max(1000).optional(),
  supportEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
})
type FormData = z.infer<typeof schema>

const COLOR_PRESETS = [
  { name: "Indigo", primary: "#4F46E5", secondary: "#818CF8", accent: "#C7D2FE" },
  { name: "Blue", primary: "#2563EB", secondary: "#60A5FA", accent: "#BFDBFE" },
  { name: "Emerald", primary: "#059669", secondary: "#34D399", accent: "#A7F3D0" },
  { name: "Rose", primary: "#E11D48", secondary: "#FB7185", accent: "#FECDD3" },
  { name: "Amber", primary: "#D97706", secondary: "#FBBF24", accent: "#FDE68A" },
  { name: "Slate", primary: "#0F172A", secondary: "#475569", accent: "#CBD5E1" },
  { name: "Violet", primary: "#7C3AED", secondary: "#A78BFA", accent: "#DDD6FE" },
  { name: "Teal", primary: "#0D9488", secondary: "#2DD4BF", accent: "#99F6E4" },
]

export default function BrandingPage() {
  const router = useRouter()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      primaryColor: "#4F46E5",
      secondaryColor: "#818CF8",
      accentColor: "#C7D2FE",
    },
  })

  useEffect(() => {
    const id = sessionStorage.getItem("onboarding_company_id")
    if (!id) {
      router.push(ROUTES.ONBOARDING_COMPANY)
      return
    }
    setCompanyId(id)
  }, [router])

  const primaryColor = watch("primaryColor")
  const tagline = watch("tagline")
  const description = watch("description")

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setValue("primaryColor", preset.primary)
    setValue("secondaryColor", preset.secondary)
    setValue("accentColor", preset.accent)
  }

  const onSubmit = (data: FormData) => {
    if (!companyId) return
    setServerError(null)
    startTransition(async () => {
      const result = await saveCompanyBranding({ companyId, ...data })
      if (!result.success) {
        setServerError(result.error ?? "Failed to save branding.")
        return
      }
      router.push(ROUTES.ONBOARDING_SUBDOMAIN)
    })
  }

  return (
    <div className="animate-fade-in">
      <StepIndicator currentStep={2} />

      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Palette className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brand your workspace</h1>
          <p className="text-muted-foreground mt-1">
            Vendors will see your logo, colors, and description on your portal.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="branding-form">
          {/* Color presets */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Brand colors
            </h2>

            {/* Preset swatches */}
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 rounded-lg p-2 hover:bg-secondary transition-colors",
                    primaryColor === preset.primary && "bg-secondary ring-1 ring-primary"
                  )}
                  title={preset.name}
                >
                  <div
                    className="h-8 w-8 rounded-full border border-black/10"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span className="text-xs text-muted-foreground">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Manual color inputs */}
            <div className="grid gap-3 grid-cols-3">
              {[
                { id: "primaryColor", label: "Primary" },
                { id: "secondaryColor", label: "Secondary" },
                { id: "accentColor", label: "Accent" },
              ].map(({ id, label }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id} className="text-xs">{label}</Label>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-7 w-7 shrink-0 rounded border border-input"
                      style={{ backgroundColor: watch(id as keyof FormData) as string }}
                    />
                    <Input
                      id={id}
                      className={cn("font-mono text-xs h-7", errors[id as keyof FormData] && "border-destructive")}
                      placeholder="#4F46E5"
                      {...register(id as keyof FormData)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Portal content
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="Building the future, together"
                {...register("tagline")}
              />
              <p className="text-xs text-muted-foreground">
                A short phrase shown on your public vendor portal. Max 120 characters.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Company description</Label>
              <textarea
                id="description"
                rows={4}
                placeholder="Tell vendors about your company, culture, and what makes you a great partner..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                {...register("description")}
              />
              <p className="text-xs text-muted-foreground">
                {(description ?? "").length}/1000 characters
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supportEmail">Vendor support email</Label>
              <Input
                id="supportEmail"
                type="email"
                placeholder="vendors@yourcompany.com"
                className={cn(errors.supportEmail && "border-destructive")}
                {...register("supportEmail")}
              />
              {errors.supportEmail && (
                <p className="text-xs text-destructive">{errors.supportEmail.message}</p>
              )}
            </div>
          </div>
        </form>

        {/* Live preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>Portal preview</span>
          </div>
          <div
            className="rounded-xl border overflow-hidden shadow-card"
            style={{ "--preview-primary": primaryColor } as React.CSSProperties}
          >
            {/* Preview header */}
            <div
              className="px-6 py-8 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">Your Company</p>
                  <p className="text-white/70 text-xs">Vendor Portal</p>
                </div>
              </div>
              <h3 className="font-bold text-lg leading-tight">
                {tagline || "Your tagline will appear here"}
              </h3>
              <p className="text-white/80 text-sm mt-2 line-clamp-2">
                {description || "Your company description will appear here for vendors to read."}
              </p>
            </div>

            {/* Preview body */}
            <div className="bg-white p-5 space-y-3">
              <div
                className="h-9 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                Submit candidates
              </div>
              <div className="rounded-lg border p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground text-sm mb-1">Open opportunities</p>
                <p>Senior React Developer · Bangalore</p>
                <p className="text-muted-foreground/60">DevOps Engineer · Remote</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            This is how your portal will appear to vendors
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="ghost"
          onClick={() => router.push(ROUTES.ONBOARDING_COMPANY)}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Step 2 of 5</p>
          <Button type="submit" form="branding-form" size="lg" loading={isPending}>
            {!isPending && (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
            {isPending && "Saving…"}
          </Button>
        </div>
      </div>
    </div>
  )
}
