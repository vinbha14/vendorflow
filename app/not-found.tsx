// app/not-found.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-brand">
            <Zap className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* 404 */}
        <div>
          <p className="text-8xl font-bold text-primary/20 leading-none select-none">404</p>
          <h1 className="text-2xl font-bold mt-2">Page not found</h1>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Check the URL or head back home.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              Go to dashboard
            </Link>
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          If you believe this is an error, contact{" "}
          <a href="mailto:support@vendorflow.com" className="text-primary hover:underline">
            support@vendorflow.com
          </a>
        </p>
      </div>
    </div>
  )
}
