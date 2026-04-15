// app/onboarding/subdomain/page.tsx
"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRight, ArrowLeft, Globe, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { setCompanySubdomain, checkSubdomainAvailability } from "@/services/company.service"
import { ROUTES } from "@/config/constants"
import { cn, generateSlug } from "@/lib/utils"

const schema = z.object({
  subdomain: z
    .string()
    .min(3, "Minimum 3 characters")
    .max(50, "Maximum 50 characters")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
      "Only lowercase letters, numbers, and hyphens. Must start and end with a letter or number."
    ),
})
type FormData = z.infer<typeof schema>

export default function SubdomainPage() {
  const router = useRouter()
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [availabilityState, setAvailabilityState] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "vendorflow.com"

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  })

  const subdomain = watch("subdomain", "")

  useEffect(() => {
    const id = sessionStorage.getItem("onboarding_company_id")
    if (!id) { router.push(ROUTES.ONBOARDING_COMPANY); return }
    setCompanyId(id)

    // Pre-populate with a suggestion based on company name
    const suggestion = sessionStorage.getItem("onboarding_company_slug")
    if (suggestion) setValue("subdomain", suggestion)
  }, [router, setValue])

  // Debounced availability check
  const checkAvailability = useCallback(
    async (value: string) => {
      if (value.length < 3 || errors.subdomain) {
        setAvailabilityState("idle")
        return
      }
      setAvailabilityState("checking")
      try {
        const { available } = await checkSubdomainAvailability(value, companyId ?? undefined)
        setAvailabilityState(available ? "available" : "taken")
      } catch {
        setAvailabilityState("idle")
      }
    },
    [companyId, errors.subdomain]
  )

  useEffect(() => {
    if (!subdomain || subdomain.length < 3) { setAvailabilityState("idle"); return }
    const timer = setTimeout(() => checkAvailability(subdomain), 500)
    return () => clearTimeout(timer)
  }, [subdomain, checkAvailability])

  const onSubmit = (data: FormData) => {
    if (!companyId) return
    if (availabilityState === "taken") return
    setServerError(null)
    startTransition(async () => {
      const result = await setCompanySubdomain({ companyId, subdomain: data.subdomain })
      if (!result.success) {
        setServerError(result.error ?? "Failed to set subdomain.")
        return
      }
      router.push(ROUTES.ONBOARDING_PLAN)
    })
  }

  return (
    <div className="animate-fade-in">
      <StepIndicator currentStep={3} />

      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Choose your subdomain</h1>
          <p className="text-muted-foreground mt-1">
            This will be the URL of your vendor portal. Choose something recognizable.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="flex items-center gap-0">
              <div className="flex items-center h-9 rounded-l-md border border-r-0 border-input bg-secondary px-3 text-sm text-muted-foreground whitespace-nowrap">
                https://
              </div>
              <Input
                id="subdomain"
                autoFocus
                placeholder="acme-corp"
                className={cn(
                  "rounded-none border-x-0 font-mono",
                  errors.subdomain && "border-destructive",
                  availabilityState === "taken" && "border-destructive",
                  availabilityState === "available" && "border-success"
                )}
                {...register("subdomain", {
                  onChange: (e) => {
                    // Auto-lowercase and clean
                    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                    setValue("subdomain", cleaned, { shouldValidate: true })
                  },
                })}
              />
              <div className="flex items-center h-9 rounded-r-md border border-l-0 border-input bg-secondary px-3 text-sm text-muted-foreground whitespace-nowrap">
                .{appDomain}
              </div>
            </div>

            {/* Availability indicator */}
            <div className="flex items-center gap-2 h-5">
              {availabilityState === "checking" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Checking availability…</span>
                </>
              )}
              {availabilityState === "available" && (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <span className="text-xs text-success font-medium">
                    {subdomain}.{appDomain} is available!
                  </span>
                </>
              )}
              {availabilityState === "taken" && (
                <>
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs text-destructive">
                    This subdomain is already taken. Try another.
                  </span>
                </>
              )}
              {errors.subdomain && availabilityState === "idle" && (
                <span className="text-xs text-destructive">{errors.subdomain.message}</span>
              )}
            </div>
          </div>

          {/* Preview URL */}
          {subdomain && availabilityState === "available" && (
            <div className="rounded-lg bg-secondary/60 px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your portal URLs</p>
              <div className="space-y-1.5 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs w-24">Public portal:</span>
                  <span className="text-foreground text-xs">
                    https://{subdomain}.{appDomain}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs w-24">Dashboard:</span>
                  <span className="text-foreground text-xs">
                    https://{subdomain}.{appDomain}/dashboard
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rules */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Subdomain rules:</p>
            <ul className="space-y-0.5 pl-3">
              <li>• 3–50 characters</li>
              <li>• Lowercase letters, numbers, and hyphens only</li>
              <li>• Must start and end with a letter or number</li>
              <li>• Cannot be changed easily after setup — choose carefully</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(ROUTES.ONBOARDING_BRANDING)}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">Step 3 of 5</p>
            <Button
              type="submit"
              size="lg"
              disabled={availabilityState !== "available" || isPending}
              loading={isPending}
            >
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
      </form>
    </div>
  )
}
