// components/settings/invite-team-member-form.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["COMPANY_ADMIN", "HIRING_MANAGER"]),
})
type FormData = z.infer<typeof schema>

export function InviteTeamMemberForm({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "HIRING_MANAGER" },
  })

  const onSubmit = (data: FormData) => {
    setError(null)
    startTransition(async () => {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, companyId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? "Failed to send invitation."); return }
      setSent(true)
      reset()
      setTimeout(() => { setSent(false); router.refresh() }, 3000)
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="colleague@company.com"
            className={cn(errors.email && "border-destructive")}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            {...register("role")}
          >
            <option value="HIRING_MANAGER">Hiring Manager</option>
            <option value="COMPANY_ADMIN">Company Admin</option>
          </select>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={isPending} className="gap-2">
          {!isPending && <><Send className="h-3.5 w-3.5" />Send invitation</>}
          {isPending && "Sending…"}
        </Button>
        {sent && (
          <div className="flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            Invitation sent!
          </div>
        )}
      </div>
    </form>
  )
}
