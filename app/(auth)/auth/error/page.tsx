// app/(auth)/auth/error/page.tsx
"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/constants"

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration. Please contact support.",
  AccessDenied: "You do not have permission to access this resource.",
  Verification: "The verification link is invalid or has expired. Please request a new one.",
  OAuthSignin: "Could not sign in with the selected provider. Please try again.",
  OAuthCallback: "Error during OAuth callback. Please try again.",
  OAuthCreateAccount: "Could not create an account with this provider.",
  EmailCreateAccount: "Could not create an account with this email.",
  Callback: "An error occurred during sign in. Please try again.",
  OAuthAccountNotLinked:
    "This email is already associated with a different sign-in method. Please sign in using your original method.",
  EmailSignin: "The email sign-in link is invalid or has expired.",
  CredentialsSignin: "Invalid email or password. Please check your credentials and try again.",
  SessionRequired: "You must be signed in to access this page.",
  Default: "An unexpected error occurred. Please try again.",
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") ?? "Default"
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES["Default"]!

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Sign in error</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      <div className="space-y-3">
        <Button className="w-full" asChild>
          <Link href={ROUTES.SIGN_IN}>Try again</Link>
        </Button>
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href={ROUTES.HOME} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Sign in error</h1>
          <p className="text-sm text-muted-foreground">Loading error details...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
