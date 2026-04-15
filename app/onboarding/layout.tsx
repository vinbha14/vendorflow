// app/onboarding/layout.tsx
import Link from "next/link"
import { Zap, ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"

const STEPS = [
  { id: 1, label: "Company details", href: ROUTES.ONBOARDING_COMPANY },
  { id: 2, label: "Branding", href: ROUTES.ONBOARDING_BRANDING },
  { id: 3, label: "Subdomain", href: ROUTES.ONBOARDING_SUBDOMAIN },
  { id: 4, label: "Choose plan", href: ROUTES.ONBOARDING_PLAN },
  { id: 5, label: "Billing", href: ROUTES.ONBOARDING_BILLING },
]

function getStepFromPath(pathname?: string): number {
  // This is called with the current step number passed in from each page
  return 1
}

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b">
        <div className="container max-w-5xl mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-foreground">VendorFlow</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">{session.user.email}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-2xl mx-auto py-12 px-6">
        {children}
      </main>
    </div>
  )
}
