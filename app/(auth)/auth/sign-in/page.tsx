// app/(auth)/auth/sign-in/page.tsx
"use client"

import { Suspense, useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight, AlertCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/config/constants"
import { cn } from "@/lib/utils"

function SignInForm() {
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get("callbackUrl") ?? ""
  // Never use /api/auth/error as a callback
  const callbackUrl = rawCallback.includes("/api/auth") ? ROUTES.DASHBOARD : (rawCallback || ROUTES.DASHBOARD)
  const registered = searchParams.get("registered")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        })

        if (!result?.ok || result?.error) {
          setError("Invalid email or password. Please try again.")
          return
        }

        // Hard redirect — bypasses any Next.js router state issues
        window.location.href = callbackUrl
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your VendorFlow workspace</p>
      </div>

      {registered && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">Account created! Sign in below.</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href={ROUTES.FORGOT_PASSWORD} className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? "Signing in…" : (
            <><span>Sign in</span><ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </form>

      <div className="rounded-lg border bg-secondary/30 p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Demo accounts</p>
        {[
          { label: "Company Admin", email: "priya@techcorpindia.com", pwd: "Demo@123456" },
          { label: "Vendor", email: "ravi@talentbridge.in", pwd: "Vendor@123456" },
          { label: "Super Admin", email: "admin@vendorflow.com", pwd: "Admin@123456" },
        ].map((a) => (
          <button
            key={a.email}
            type="button"
            onClick={() => { setEmail(a.email); setPassword(a.pwd) }}
            className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-secondary transition-colors text-left"
          >
            <span className="text-muted-foreground">{a.label}</span>
            <span className="font-mono text-foreground">{a.email}</span>
          </button>
        ))}
        <p className="text-xs text-muted-foreground">Click any account above to auto-fill credentials</p>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.SIGN_UP} className="font-medium text-primary hover:underline">
          Create one free
        </Link>
      </p>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <SignInForm />
    </Suspense>
  )
}
