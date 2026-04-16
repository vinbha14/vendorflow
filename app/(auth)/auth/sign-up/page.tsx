// app/(auth)/auth/sign-up/page.tsx
"use client"

import { Suspense, useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight, XCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerUser } from "@/services/auth.service"
import { ROUTES } from "@/config/constants"

const RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

function SignUpForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords do not match."); return }
    setError(null)
    startTransition(async () => {
      try {
        const result = await registerUser({ name, email, password, confirmPassword: confirm })
        if (!result?.success) { setError(result?.error ?? "Registration failed."); return }

        const signInResult = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        })

        if (signInResult?.ok) {
          window.location.href = ROUTES.ONBOARDING_COMPANY
        } else {
          router.push(`${ROUTES.SIGN_IN}?registered=true&email=${encodeURIComponent(email)}`)
        }
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start your 14-day free trial. No credit card required.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" type="text" placeholder="Priya Sharma" autoFocus value={name} onChange={e => setName(e.target.value)} required minLength={2} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="priya@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={showPwd ? "text" : "password"} placeholder="Create a strong password" className="pr-10" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="grid grid-cols-2 gap-1 pt-1">
              {RULES.map(r => (
                <div key={r.label} className="flex items-center gap-1.5">
                  {r.test(password) ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" /> : <XCircle className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                  <span className={`text-xs ${r.test(password) ? "text-green-600" : "text-muted-foreground"}`}>{r.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type={showPwd ? "text" : "password"} placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </div>

        <p className="text-xs text-muted-foreground">
          By signing up you agree to our{" "}
          <Link href={ROUTES.TERMS} className="text-primary hover:underline">Terms</Link>
          {" "}and{" "}
          <Link href={ROUTES.PRIVACY} className="text-primary hover:underline">Privacy Policy</Link>.
        </p>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? "Creating account…" : <><span>Create account</span><ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={ROUTES.SIGN_IN} className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <SignUpForm />
    </Suspense>
  )
}
