// app/(auth)/auth/sign-in/page.tsx
"use client"

import { Suspense, useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema, type LoginInput } from "@/types/auth"
import { ROUTES } from "@/config/constants"
import { cn } from "@/lib/utils"

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? ROUTES.DASHBOARD
  const urlError = searchParams.get("error")
  const registered = searchParams.get("registered")

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginInput) => {
    setServerError(null)
    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        })

        if (result?.error || !result?.ok) {
          setServerError("Invalid email or password. Please try again.")
          return
        }

        // Use window.location for a hard redirect to avoid stale session state
        window.location.href = callbackUrl === "/api/auth/error" ? ROUTES.DASHBOARD : callbackUrl
      } catch (err) {
        setServerError("Something went wrong. Please try again.")
      }
    })
  }

  const errorMessage = serverError ?? (
    urlError === "OAuthAccountNotLinked" ? "This email is already registered with a different method." :
    urlError === "SessionRequired" ? "Please sign in to access this page." :
    urlError && urlError !== "undefined" ? "Something went wrong. Please try again." : null
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your VendorFlow workspace</p>
      </div>

      {registered && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">Account created successfully. Sign in below.</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email" type="email" placeholder="you@company.com"
            autoComplete="email" autoFocus
            className={cn(errors.email && "border-destructive")}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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
              id="password" type={showPassword ? "text" : "password"}
              placeholder="••••••••" autoComplete="current-password"
              className={cn("pr-10", errors.password && "border-destructive")}
              {...register("password")}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isPending}>
          {!isPending && (<>Sign in <ArrowRight className="h-4 w-4" /></>)}
          {isPending && "Signing in…"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.SIGN_UP} className="font-medium text-primary hover:underline underline-offset-4">
          Create one free
        </Link>
      </p>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
