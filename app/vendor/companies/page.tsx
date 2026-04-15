// app/vendor/companies/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, ArrowRight, MapPin, Globe, TrendingUp } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "My Companies" }

export default async function VendorCompaniesPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id, isActive: true },
  })
  if (!vendorUser) redirect(ROUTES.SIGN_IN)

  const relationships = await prisma.vendorCompany.findMany({
    where: { vendorId: vendorUser.vendorId },
    orderBy: [{ status: "asc" }, { approvedAt: "desc" }],
    include: {
      company: {
        include: {
          branding: {
            select: {
              primaryColor: true,
              secondaryColor: true,
              tagline: true,
              description: true,
              supportEmail: true,
              openOpportunities: true,
            },
          },
        },
      },
    },
  })

  const approvedCount = relationships.filter((r) => r.status === "APPROVED").length
  const pendingCount = relationships.filter((r) => r.status === "PENDING").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Companies"
        description={`${approvedCount} active${pendingCount > 0 ? ` · ${pendingCount} pending approval` : ""}`}
      />

      {relationships.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="You'll be added here once a company invites and approves you as a vendor partner."
          size="lg"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {relationships.map((rel) => {
            const branding = rel.company.branding
            const primaryColor = branding?.primaryColor ?? "#4F46E5"
            const opportunities = (branding?.openOpportunities as Array<{ title: string; location: string; type: string }> | null) ?? []

            return (
              <Link
                key={rel.id}
                href={`${ROUTES.VENDOR_COMPANIES}/${rel.company.id}`}
                className="group rounded-xl border bg-card overflow-hidden hover:shadow-card-hover transition-all"
              >
                {/* Color stripe */}
                <div className="h-1.5" style={{ backgroundColor: primaryColor }} />

                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    {rel.company.logoUrl ? (
                      <img
                        src={rel.company.logoUrl}
                        alt={rel.company.name}
                        className="h-11 w-11 rounded-lg object-contain border bg-white p-1 shrink-0"
                      />
                    ) : (
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white font-bold text-lg"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {rel.company.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{rel.company.name}</p>
                      {branding?.tagline && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{branding.tagline}</p>
                      )}
                    </div>
                    <StatusBadge status={rel.status} type="vendor" className="shrink-0" />
                  </div>

                  {/* Location */}
                  {rel.company.country && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{[rel.company.city, rel.company.country].filter(Boolean).join(", ")}</span>
                    </div>
                  )}

                  {/* Stats (if approved) */}
                  {rel.status === "APPROVED" && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Submitted", value: rel.submissionsCount },
                        { label: "Accepted", value: rel.acceptedCount },
                        {
                          label: "Rate",
                          value: rel.submissionsCount > 0
                            ? `${Math.round((rel.acceptedCount / rel.submissionsCount) * 100)}%`
                            : "—",
                        },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-secondary/60 py-2">
                          <p className="text-base font-bold">{stat.value}</p>
                          <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Open opportunities */}
                  {rel.status === "APPROVED" && opportunities.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        {opportunities.length} open role{opportunities.length !== 1 ? "s" : ""}
                      </p>
                      <div className="space-y-1.5">
                        {opportunities.slice(0, 2).map((opp, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="truncate text-foreground">{opp.title}</span>
                            <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">{opp.type}</Badge>
                          </div>
                        ))}
                        {opportunities.length > 2 && (
                          <p className="text-[10px] text-muted-foreground">+{opportunities.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pending message */}
                  {rel.status === "PENDING" && (
                    <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                      <p className="text-xs text-amber-700">
                        Your application is under review. You'll be notified once approved.
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  {rel.status === "APPROVED" && (
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        style={{ backgroundColor: primaryColor }}
                        asChild
                      >
                        <Link href={ROUTES.VENDOR_CANDIDATES_NEW}>Submit candidate</Link>
                      </Button>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
