// app/vendor/settings/page.tsx
"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { cn } from "@/lib/utils"

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().max(1000).optional(),
  city: z.string().optional(),
  country: z.string(),
  taxId: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function VendorSettingsPage() {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    fetch("/api/vendor/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.vendor) {
          reset(data.vendor)
          setLoaded(true)
        }
      })
      .catch(() => setLoaded(true))
  }, [reset])

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = await fetch("/api/vendor/profile", {
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

  if (!loaded) {
    return (
      <div className="max-w-2xl space-y-8">
        <PageHeader title="Vendor Settings" description="Loading…" />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-secondary" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader title="Vendor Settings" description="Manage your vendor organization profile." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Organization details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Organization name *</Label>
                <Input className={cn(errors.name && "border-destructive")} {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Contact email *</Label>
                <Input type="email" className={cn(errors.email && "border-destructive")} {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input type="tel" placeholder="+91 98765 43210" {...register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input type="url" placeholder="https://yourcompany.com" {...register("website")} />
                {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Tax ID / GST</Label>
                <Input placeholder="29AABCT1332L1Z8" {...register("taxId")} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input placeholder="Mumbai" {...register("city")} />
              </div>
              <div className="space-y-1.5">
                <Label>Country *</Label>
                <Input placeholder="IN" {...register("country")} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>About your organization</Label>
                <textarea
                  rows={4}
                  placeholder="Tell companies about your staffing agency, specialties, and experience…"
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  {...register("description")}
                />
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
            {!isPending && <><Save className="h-4 w-4" />Save changes</>}
            {isPending && "Saving…"}
          </Button>
        </div>
      </form>
    </div>
  )
}
