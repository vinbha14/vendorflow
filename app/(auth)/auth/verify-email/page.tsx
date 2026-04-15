// app/(auth)/auth/verify-email/page.tsx
import Link from "next/link"
import { MailCheck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/constants"

export const metadata = { title: "Verify your email" }

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center animate-fade-in">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-10 w-10 text-primary" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          We&apos;ve sent a verification link to your email address. Click the
          link to activate your account and continue setting up your workspace.
        </p>
      </div>

      {/* Info box */}
      <div className="rounded-xl border bg-secondary/50 p-5 text-left space-y-3">
        <p className="text-sm font-medium">Didn&apos;t receive the email?</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>• Check your spam or junk folder</li>
          <li>• Make sure you entered the correct email address</li>
          <li>• The link expires in 48 hours</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button className="w-full" variant="outline" asChild>
          <a href="mailto:">Open email app</a>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.SIGN_IN} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </Button>
      </div>

      {/* Dev note */}
      {process.env.NODE_ENV === "development" && (
        <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700">
          <strong>Dev mode:</strong> Email verification is automatically skipped.
          Your account is already active — go ahead and{" "}
          <Link href={ROUTES.SIGN_IN} className="underline">sign in</Link>.
        </p>
      )}
    </div>
  )
}
