// app/(auth)/auth/sign-in/page.tsx
"use client"

import { useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Zap, ArrowRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema, type LoginInput } from "@/types/auth"
import { ROUTES } from "@/config/constants"
import { cn } from "@/lib/utils"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? ROUTES.DASHBOARD
  const urlError = searchParams.get("error")

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setServerError("Invalid email or password. Please try again.")
        return
      }

      if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    })
  }

  const errorMessage =
    serverError ??
    (urlError === "OAuthAccountNotLinked"
      ? "This email is already registered with a different sign-in method."
      : urlError === "SessionRequired"
      ? "Please sign in to access this page."
      : urlError
      ? "Something went wrong. Please try again."
      : null)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your VendorFlow workspace
        </p>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
            className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className={cn(
                "pr-10",
                errors.password && "border-destructive focus-visible:ring-destructive"
              )}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isPending}
        >
          {!isPending && (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
          {isPending && "Signing in…"}
        </Button>
      </form>

      {/* Demo accounts hint (dev only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Demo accounts
          </p>
          {[
            { label: "Company Admin", email: "priya@techcorpindia.com" },
            { label: "Hiring Manager", email: "arjun@techcorpindia.com" },
            { label: "Vendor Admin", email: "ravi@talentbridge.in" },
            { label: "Super Admin", email: "admin@vendorflow.com" },
          ].map((account) => (
            <div key={account.email} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{account.label}</span>
              <span className="text-xs font-mono text-foreground">{account.email}</span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Password: Demo@123456 / Vendor@123456 / Admin@123456</p>
        </div>
      )}

      {/* Sign up link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={ROUTES.SIGN_UP}
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Create one free
        </Link>
      </p>
    </div>
  )
}
