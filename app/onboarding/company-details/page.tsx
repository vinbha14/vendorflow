// app/onboarding/company-details/page.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRight, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { createCompanyWorkspace } from "@/services/company.service"
import { ROUTES, COUNTRIES } from "@/config/constants"
import { cn } from "@/lib/utils"

const schema = z.object({
  name: z.string().min(2, "At least 2 characters").max(100),
  legalName: z.string().optional(),
  country: z.string().min(2).max(2),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().url("Enter a valid URL (include https://)").optional().or(z.literal("")),
  industry: z.string().optional(),
  size: z.string().optional(),
  currency: z.string().min(3).max(3),
  timezone: z.string(),
})

type FormData = z.infer<typeof schema>

const INDUSTRIES = [
  "Technology", "Financial Services", "Healthcare", "E-Commerce",
  "Manufacturing", "Consulting", "Media & Entertainment", "Education",
  "Real Estate", "Logistics", "Energy", "Other",
]

const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+",
]

export default function CompanyDetailsPage() {
  const router = useRouter()
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
      country: "IN",
      currency: "INR",
      timezone: "Asia/Kolkata",
    },
  })

  const selectedCountry = watch("country")

  const onCountryChange = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code)
    if (country) {
      setValue("country", code)
      setValue("currency", country.currency)
      setValue("timezone", country.timezone)
    }
  }

  const onSubmit = (data: FormData) => {
    setServerError(null)
    startTransition(async () => {
      const result = await createCompanyWorkspace(data)
      if (!result.success) {
        setServerError(result.error ?? "Failed to create workspace. Please try again.")
        return
      }
      // Store companyId in sessionStorage for subsequent steps
      if (result.companyId) {
        sessionStorage.setItem("onboarding_company_id", result.companyId)
      }
      router.push(ROUTES.ONBOARDING_BRANDING)
    })
  }

  return (
    <div className="animate-fade-in">
      <StepIndicator currentStep={1} />

      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tell us about your company</h1>
          <p className="text-muted-foreground mt-1">
            This information will appear in your vendor-facing portal and billing records.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section: Basic info */}
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Basic information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="name">
                Company name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Acme Corp"
                autoFocus
                className={cn(errors.name && "border-destructive")}
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="legalName">Legal entity name</Label>
              <Input
                id="legalName"
                placeholder="Acme Corp Private Limited"
                {...register("legalName")}
              />
              <p className="text-xs text-muted-foreground">Used for invoices and contracts</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taxId">Tax ID / GST / VAT number</Label>
              <Input
                id="taxId"
                placeholder="29AABCT1332L1Z8"
                {...register("taxId")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://acmecorp.com"
                className={cn(errors.website && "border-destructive")}
                {...register("website")}
              />
              {errors.website && (
                <p className="text-xs text-destructive">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <select
                id="industry"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("industry")}
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="size">Company size</Label>
              <select
                id="size"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("size")}
              >
                <option value="">Select size</option>
                {COMPANY_SIZES.map((s) => (
                  <option key={s} value={s}>{s} employees</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section: Location & region */}
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Location &amp; region
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="country">
                Country <span className="text-destructive">*</span>
              </Label>
              <select
                id="country"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedCountry}
                onChange={(e) => onCountryChange(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state">State / Province</Label>
              <Input id="state" placeholder="Karnataka" {...register("state")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Bangalore" {...register("city")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postalCode">Postal / ZIP code</Label>
              <Input id="postalCode" placeholder="560001" {...register("postalCode")} />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="address">Street address</Label>
              <Input id="address" placeholder="123, MG Road, Indiranagar" {...register("address")} />
            </div>
          </div>

          {/* Currency & timezone (auto-set by country) */}
          <div className="flex items-center gap-3 rounded-lg bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
            <span>
              Currency: <strong className="text-foreground">{watch("currency")}</strong>
            </span>
            <span>·</span>
            <span>
              Timezone: <strong className="text-foreground">{watch("timezone")}</strong>
            </span>
            <span className="ml-auto text-xs">Auto-set from country</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <p className="text-sm text-muted-foreground">Step 1 of 5</p>
          <Button type="submit" size="lg" loading={isPending}>
            {!isPending && (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
            {isPending && "Creating workspace…"}
          </Button>
        </div>
      </form>
    </div>
  )
}
