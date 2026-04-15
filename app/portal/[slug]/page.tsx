// app/portal/[slug]/page.tsx
import { notFound } from "next/navigation"
import { getTenantBySlug } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Globe, Mail, Users, ArrowRight, Building2, Zap } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const company = await getTenantBySlug(slug)
  if (!company) return { title: "Not Found" }

  return {
    title: `${company.name} — Vendor Portal`,
    description: company.branding?.description ?? `Vendor portal for ${company.name}`,
  }
}

export default async function CompanyPortalPage({ params }: PageProps) {
  const { slug } = await params
  const company = await getTenantBySlug(slug)

  if (!company) notFound()

  // Fetch full branding data
  const fullCompany = await prisma.company.findUnique({
    where: { id: company.id },
    include: {
      branding: true,
    },
  })

  if (!fullCompany || fullCompany.status !== "ACTIVE") notFound()

  const branding = fullCompany.branding
  const primaryColor = branding?.primaryColor ?? "#4F46E5"
  const secondaryColor = branding?.secondaryColor ?? "#818CF8"
  const opportunities = (branding?.openOpportunities as Array<{
    title: string
    location: string
    type: string
    skills?: string[]
  }> | null) ?? []

  return (
    <div className="min-h-screen bg-background">
      {/* Inject brand colors as CSS vars */}
      <style>{`
        :root {
          --brand-primary: ${primaryColor};
          --brand-secondary: ${secondaryColor};
        }
      `}</style>

      {/* Hero / Header */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

        <div className="relative container max-w-5xl mx-auto px-6 py-16">
          {/* Company identity */}
          <div className="flex items-start gap-5 mb-8">
            {fullCompany.logoUrl ? (
              <img
                src={fullCompany.logoUrl}
                alt={fullCompany.name}
                className="h-20 w-20 rounded-2xl object-contain bg-white p-2 shadow-lg"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur"
              >
                <Building2 className="h-10 w-10 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{fullCompany.name}</h1>
              {branding?.tagline && (
                <p className="text-white/80 mt-1 text-lg">{branding.tagline}</p>
              )}
              <div className="flex items-center gap-3 mt-3">
                {fullCompany.country && (
                  <span className="flex items-center gap-1.5 text-white/70 text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    {fullCompany.city ? `${fullCompany.city}, ` : ""}{fullCompany.country}
                  </span>
                )}
                {fullCompany.industry && (
                  <span className="flex items-center gap-1.5 text-white/70 text-sm">
                    <Users className="h-3.5 w-3.5" />
                    {fullCompany.industry}
                  </span>
                )}
                {fullCompany.website && (
                  <a
                    href={fullCompany.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-white hover:bg-white/90 font-semibold"
              style={{ color: primaryColor }}
              asChild
            >
              <Link href={`/portal/${slug}/apply`}>
                Submit candidates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {branding?.supportEmail && (
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10"
                asChild
              >
                <a href={`mailto:${branding.supportEmail}`}>
                  <Mail className="h-4 w-4" />
                  Contact team
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container max-w-5xl mx-auto px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Left: About + opportunities */}
          <div className="lg:col-span-2 space-y-10">
            {/* About */}
            {branding?.description && (
              <section>
                <h2 className="text-lg font-semibold mb-4">About us</h2>
                <p className="text-muted-foreground leading-relaxed">{branding.description}</p>
              </section>
            )}

            {/* Open opportunities */}
            {opportunities.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Open opportunities</h2>
                  <Badge variant="secondary">{opportunities.length} open</Badge>
                </div>
                <div className="space-y-3">
                  {opportunities.map((opp, i) => (
                    <div
                      key={i}
                      className="rounded-xl border bg-card p-5 hover:shadow-card-hover transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{opp.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {opp.location}
                            </span>
                            <Badge variant="secondary" className="text-xs">{opp.type}</Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          style={{ backgroundColor: primaryColor, color: "white" }}
                          asChild
                        >
                          <Link href={`/portal/${slug}/apply?role=${encodeURIComponent(opp.title)}`}>
                            Submit candidate
                          </Link>
                        </Button>
                      </div>
                      {opp.skills && opp.skills.length > 0 && (
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          {opp.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right: Vendor CTA sidebar */}
          <div className="space-y-6">
            {/* Partner with us */}
            <div
              className="rounded-xl overflow-hidden border"
            >
              <div className="p-1" style={{ backgroundColor: primaryColor }}>
                <div className="rounded-lg bg-white/10 px-4 py-5 text-white">
                  <h3 className="font-bold">Become a vendor partner</h3>
                  <p className="text-white/80 text-sm mt-1">
                    Join our vendor network and start submitting candidates for our open roles.
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <Button className="w-full" asChild style={{ backgroundColor: primaryColor }}>
                  <Link href={`/portal/${slug}/register`}>
                    Register as vendor
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Already registered?{" "}
                  <Link href="/auth/sign-in" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Contact */}
            {branding?.supportEmail && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-3">Get in touch</h3>
                <a
                  href={`mailto:${branding.supportEmail}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {branding.supportEmail}
                </a>
              </div>
            )}

            {/* Powered by VendorFlow */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50">
              <Zap className="h-3 w-3" />
              <span>Powered by VendorFlow</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
