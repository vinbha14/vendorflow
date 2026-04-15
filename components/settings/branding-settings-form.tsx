// components/settings/branding-settings-form.tsx
"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, CheckCircle2, Eye, Building2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { saveCompanyBranding } from "@/services/company.service"
import { useFileUpload } from "@/hooks/use-file-upload"
import { cn } from "@/lib/utils"
import type { Company, CompanyBranding } from "@prisma/client"

const schema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  tagline: z.string().max(120).optional(),
  description: z.string().max(1000).optional(),
  supportEmail: z.string().email().optional().or(z.literal("")),
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

interface BrandingSettingsFormProps {
  companyId: string
  company: Company
  branding: CompanyBranding | null
}

export function BrandingSettingsForm({ companyId, company, branding }: BrandingSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(company.logoUrl)
  const [serverError, setServerError] = useState<string | null>(null)

  const logoUpload = useFileUpload({
    uploadType: "logo",
    companyId,
    onSuccess: async (fileUrl) => {
      setLogoUrl(fileUrl)
      // Save logo URL to company
      await fetch(`/api/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: fileUrl }),
      })
    },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      primaryColor: branding?.primaryColor ?? "#4F46E5",
      secondaryColor: branding?.secondaryColor ?? "#818CF8",
      accentColor: branding?.accentColor ?? "#C7D2FE",
      tagline: branding?.tagline ?? "",
      description: branding?.description ?? "",
      supportEmail: branding?.supportEmail ?? "",
    },
  })

  const primaryColor = watch("primaryColor")
  const tagline = watch("tagline")
  const description = watch("description")

  const onSubmit = (data: FormData) => {
    setServerError(null)
    startTransition(async () => {
      const result = await saveCompanyBranding({ companyId, ...data })
      if (!result.success) { setServerError(result.error ?? "Failed to save."); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="branding-form">
        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {/* Logo */}
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-base">Company logo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative">
                  <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-contain border bg-white p-1" />
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive text-white p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary border-2 border-dashed text-muted-foreground">
                  <Building2 className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1">
                <label className={cn(
                  "flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors w-fit",
                  logoUpload.status === "uploading" && "opacity-50 pointer-events-none"
                )}>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) logoUpload.upload(file)
                    }}
                  />
                  <Upload className="h-4 w-4" />
                  {logoUpload.status === "uploading" ? `Uploading… ${logoUpload.progress}%` : "Upload logo"}
                </label>
                <p className="text-xs text-muted-foreground mt-1.5">PNG, JPG, SVG or WebP · Max 5MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-base">Brand colors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setValue("primaryColor", preset.primary, { shouldDirty: true })
                    setValue("secondaryColor", preset.secondary, { shouldDirty: true })
                    setValue("accentColor", preset.accent, { shouldDirty: true })
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg p-2 hover:bg-secondary transition-colors",
                    primaryColor === preset.primary && "bg-secondary ring-1 ring-primary"
                  )}
                >
                  <div className="h-7 w-7 rounded-full border border-black/10" style={{ backgroundColor: preset.primary }} />
                  <span className="text-[10px] text-muted-foreground">{preset.name}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "primaryColor" as const, label: "Primary" },
                { id: "secondaryColor" as const, label: "Secondary" },
                { id: "accentColor" as const, label: "Accent" },
              ].map(({ id, label }) => (
                <div key={id} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <div className="flex items-center gap-1.5">
                    <div className="h-7 w-7 shrink-0 rounded border" style={{ backgroundColor: watch(id) }} />
                    <Input className="font-mono text-xs h-7" {...register(id)} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader className="pb-4"><CardTitle className="text-base">Portal content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tagline</Label>
              <Input placeholder="Building the future, together" {...register("tagline")} />
            </div>
            <div className="space-y-1.5">
              <Label>Company description</Label>
              <textarea
                rows={4}
                placeholder="Tell vendors about your company…"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                {...register("description")}
              />
              <p className="text-xs text-muted-foreground">{(description ?? "").length}/1000</p>
            </div>
            <div className="space-y-1.5">
              <Label>Vendor support email</Label>
              <Input type="email" placeholder="vendors@yourcompany.com" {...register("supportEmail")} />
              {errors.supportEmail && <p className="text-xs text-destructive">{errors.supportEmail.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </div>
          )}
          <Button type="submit" form="branding-form" loading={isPending} disabled={!isDirty && !isPending}>
            {!isPending && <><Save className="h-4 w-4" />Save branding</>}
            {isPending && "Saving…"}
          </Button>
        </div>
      </form>

      {/* Live preview */}
      <div className="space-y-3 sticky top-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>Live preview</span>
        </div>
        <div className="rounded-xl border overflow-hidden shadow-card">
          <div className="px-6 py-8 text-white" style={{ backgroundColor: primaryColor }}>
            <div className="flex items-center gap-3 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain bg-white/20 p-1" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <p className="font-bold text-sm">{company.name}</p>
                <p className="text-white/70 text-xs">Vendor Portal</p>
              </div>
            </div>
            <h3 className="font-bold text-lg leading-tight">{tagline || "Your tagline appears here"}</h3>
            <p className="text-white/80 text-sm mt-2 line-clamp-2">
              {description || "Your company description will appear here."}
            </p>
          </div>
          <div className="bg-white p-5 space-y-3">
            <div
              className="h-9 rounded-lg flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              Submit candidates
            </div>
            <div className="rounded-lg border p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm mb-1">Open opportunities</p>
              <p>Senior Developer · Bangalore / Remote</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
