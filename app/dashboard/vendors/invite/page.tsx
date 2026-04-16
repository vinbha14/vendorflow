// app/dashboard/vendors/invite/page.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Mail, Send, ArrowLeft, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { ROUTES } from "@/config/constants"
import { inviteVendor } from "@/services/vendor.service"
import { cn } from "@/lib/utils"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  vendorName: z.string().min(2, "Vendor name must be at least 2 characters").max(100),
  message: z.string().max(500, "Message too long").optional(),
})
type FormData = z.infer<typeof schema>

const DEFAULT_MESSAGE = `We'd love to have you as a vendor partner. Please complete your onboarding to start submitting candidates to our team.`

export default function InviteVendorPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [sentTo, setSentTo] = useState("")
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { message: DEFAULT_MESSAGE },
  })

  const onSubmit = (data: FormData) => {
    setServerError(null)
    startTransition(async () => {
      const result = await inviteVendor({
        email: data.email,
        vendorName: data.vendorName,
        message: data.message,
      })

      if (!result.success) {
        setServerError(result.error ?? "Failed to send invitation.")
        return
      }

      setSentTo(data.email)
      setSent(true)
    })
  }

  const handleSendAnother = () => {
    setSent(false)
    setSentTo("")
    reset()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <PageHeader
        title="Invite a Vendor"
        description="Send an invitation email to onboard a new vendor partner."
        actions={
          <Button variant="ghost" onClick={() => router.back()} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      {sent ? (
        /* Success state */
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Invitation sent!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                An invitation email has been sent to <strong>{sentTo}</strong>.
                They have 7 days to accept.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button onClick={handleSendAnother} variant="outline">
                <Mail className="h-4 w-4" />
                Invite another vendor
              </Button>
              <Button onClick={() => router.push(ROUTES.DASHBOARD_VENDORS)}>
                View all vendors
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <X className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Vendor details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="vendorName">
                  Vendor / agency name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vendorName"
                  placeholder="TalentBridge India"
                  autoFocus
                  className={cn(errors.vendorName && "border-destructive")}
                  {...register("vendorName")}
                />
                {errors.vendorName && (
                  <p className="text-xs text-destructive">{errors.vendorName.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This will appear in the invitation email and pre-fill their registration form.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Contact email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@vendoragency.com"
                  className={cn(errors.email && "border-destructive")}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">Personal message (optional)</Label>
                <textarea
                  id="message"
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  {...register("message")}
                />
                <p className="text-xs text-muted-foreground">
                  This message will be included in the invitation email.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What happens next */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  { icon: Mail, text: "Vendor receives an invitation email with a secure link" },
                  { icon: CheckCircle2, text: "They complete registration and vendor onboarding form" },
                  { icon: Clock, text: "You review and approve their application" },
                  { icon: Send, text: "Once approved, they can start submitting candidates" },
                ].map((step, i) => {
                  const Icon = step.icon
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{step.text}</span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending} className="gap-2">
              {!isPending && (
                <>
                  <Send className="h-4 w-4" />
                  Send invitation
                </>
              )}
              {isPending && "Sending…"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
