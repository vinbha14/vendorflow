// app/(auth)/auth/sign-up/page.tsx
"use client"

import { useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, ArrowRight, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerSchema, type RegisterInput } from "@/types/auth"
import { registerUser } from "@/services/auth.service"
import { ROUTES } from "@/config/constants"
import { cn } from "@/lib/utils"

// Password strength rules
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function SignUpPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  })

  const watchedPassword = watch("password", "")

  const onSubmit = (data: RegisterInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = await registerUser(data)

      if (!result.success) {
        setServerError(result.error ?? "Registration failed. Please try again.")
        return
      }

      // Auto sign-in after successful registration
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        // Send to onboarding wizard
        router.push(ROUTES.ONBOARDING_COMPANY)
        router.refresh()
      } else {
        // Account created but couldn't auto-sign-in — redirect to sign-in
        router.push(`${ROUTES.SIGN_IN}?registered=true`)
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      {/* Error */}
      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Priya Sharma"
            autoComplete="name"
            autoFocus
            className={cn(errors.name && "border-destructive")}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="priya@company.com"
            autoComplete="email"
            className={cn(errors.email && "border-destructive")}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              autoComplete="new-password"
              className={cn(
                "pr-10",
                errors.password && "border-destructive"
              )}
              {...register("password", {
                onChange: (e) => setPassword(e.target.value),
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password strength rules */}
          {watchedPassword.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {PASSWORD_RULES.map((rule) => {
                const passes = rule.test(watchedPassword)
                return (
                  <div key={rule.label} className="flex items-center gap-1.5">
                    {passes ? (
                      <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    )}
                    <span className={cn("text-xs", passes ? "text-success" : "text-muted-foreground")}>
                      {rule.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat your password"
            autoComplete="new-password"
            className={cn(errors.confirmPassword && "border-destructive")}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms */}
        <p className="text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href={ROUTES.TERMS} className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href={ROUTES.PRIVACY} className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        {/* Submit */}
        <Button type="submit" className="w-full" size="lg" loading={isPending}>
          {!isPending && (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
          {isPending && "Creating account…"}
        </Button>
      </form>

      {/* Sign in link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={ROUTES.SIGN_IN}
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
