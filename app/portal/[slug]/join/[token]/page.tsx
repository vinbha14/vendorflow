// app/portal/[slug]/join/[token]/page.tsx
import { notFound, redirect } from "next/navigation"
import { getInvitationByToken } from "@/services/vendor.service"
import { auth } from "@/lib/auth"
import { ROUTES } from "@/config/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, CheckCircle2, Clock, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string; token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const invitation = await getInvitationByToken(token)
  if (!invitation) return { title: "Invalid Invitation" }
  return { title: `Join ${invitation.company.name} on VendorFlow` }
}

export default async function VendorJoinPage({ params }: PageProps) {
  const { token } = await params
  const invitation = await getInvitationByToken(token)

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto text-center p-8 space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <Clock className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Invitation expired or invalid</h1>
            <p className="text-muted-foreground mt-2">
              This invitation link is no longer valid. It may have expired or already been used.
            </p>
            <p className="text-muted-foreground mt-1">
              Please contact the company that invited you to request a new invitation.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Go to homepage</Link>
          </Button>
        </div>
      </div>
    )
  }

  const session = await auth()
  const company = invitation.company
  const branding = company.branding
  const primaryColor = branding?.primaryColor ?? "#4F46E5"

  const daysLeft = Math.ceil(
    (invitation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Company branded hero */}
      <div
        className="relative py-16 px-6 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-lg mx-auto text-center">
          {/* Company logo */}
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="h-16 w-16 rounded-2xl object-contain bg-white p-2 mx-auto mb-6 shadow-lg" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 mx-auto mb-6">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">
            You&apos;ve been invited to join<br />{company.name}
          </h1>
          {invitation.vendorName && (
            <p className="text-white/80 text-lg">as a vendor partner for <strong>{invitation.vendorName}</strong></p>
          )}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge className="bg-white/20 text-white border-white/30 gap-1.5">
              <Clock className="h-3 w-3" />
              Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-12 space-y-8">
        {/* Custom message */}
        {invitation.message && (
          <div className="rounded-xl border bg-secondary/30 p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Message from {company.name}
            </p>
            <p className="text-sm text-foreground italic">&ldquo;{invitation.message}&rdquo;</p>
          </div>
        )}

        {/* What you'll get */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">As a vendor partner you can:</h2>
          <ul className="space-y-3">
            {[
              "Submit candidate profiles for open roles",
              "Track your submissions in real-time",
              "Receive instant updates when candidates are shortlisted or hired",
              "View company branding, requirements, and contact info",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Accept CTA */}
        <div className="space-y-4">
          {session?.user ? (
            // Already signed in — just accept
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Signed in as <strong>{session.user.email}</strong>
              </p>
              <Button
                size="lg"
                className="w-full"
                style={{ backgroundColor: primaryColor }}
                asChild
              >
                <Link href={`/api/invitations/${invitation.token}/accept`}>
                  Accept invitation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            // Not signed in — sign up or sign in
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full"
                style={{ backgroundColor: primaryColor }}
                asChild
              >
                <Link href={`${ROUTES.SIGN_UP}?invitation=${invitation.token}&email=${encodeURIComponent(invitation.email)}`}>
                  Create account &amp; accept
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href={`${ROUTES.SIGN_IN}?invitation=${invitation.token}`}
                  className="text-primary hover:underline"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Powered by */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50">
          <Zap className="h-3 w-3" />
          <span>Powered by VendorFlow</span>
        </div>
      </div>
    </div>
  )
}
