// components/settings/company-settings-form.tsx
"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { COUNTRIES } from "@/config/constants"
import { cn } from "@/lib/utils"
import type { Company } from "@prisma/client"

const schema = z.object({
  name: z.string().min(2).max(100),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().optional(),
  size: z.string().optional(),
  country: z.string(),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  currency: z.string(),
  timezone: z.string(),
})

type FormData = z.infer<typeof schema>

export function CompanySettingsForm({ company }: { company: Company }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: company.name,
      legalName: company.legalName ?? "",
      taxId: company.taxId ?? "",
      website: company.website ?? "",
      industry: company.industry ?? "",
      size: company.size ?? "",
      country: company.country,
      state: company.state ?? "",
      city: company.city ?? "",
      address: company.address ?? "",
      postalCode: company.postalCode ?? "",
      currency: company.currency,
      timezone: company.timezone,
    },
  })

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Basic information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Company name *</Label>
              <Input className={cn(errors.name && "border-destructive")} {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Legal entity name</Label>
              <Input placeholder="Acme Corp Pvt Ltd" {...register("legalName")} />
            </div>
            <div className="space-y-1.5">
              <Label>Tax ID / GST / VAT</Label>
              <Input placeholder="29AABCT1332L1Z8" {...register("taxId")} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input type="url" placeholder="https://..." {...register("website")} />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input placeholder="Technology" {...register("industry")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Location &amp; region</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" {...register("country")}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>State / Province</Label>
              <Input {...register("state")} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input {...register("city")} />
            </div>
            <div className="space-y-1.5">
              <Label>Postal code</Label>
              <Input {...register("postalCode")} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Street address</Label>
              <Input {...register("address")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <div className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            Saved successfully
          </div>
        )}
        <Button type="submit" loading={isPending} disabled={!isDirty && !isPending}>
          {!isPending && <><Save className="h-4 w-4" /> Save changes</>}
          {isPending && "Saving…"}
        </Button>
      </div>
    </form>
  )
}
