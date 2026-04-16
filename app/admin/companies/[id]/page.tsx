// app/admin/companies/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminCompanyActions } from "@/components/admin/admin-company-actions"
import { formatDate, buildTenantUrl } from "@/lib/utils"
import {
  Building2, Users, UserCheck, Globe, Mail,
  CreditCard, ExternalLink, Shield, AlertTriangle,
} from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Company Details — Admin" }

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "SUPER_ADMIN") {
    redirect(ROUTES.SIGN_IN)
  }

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      branding: true,
      subscription: { include: { plan: true, usageRecords: { orderBy: { recordedAt: "desc" }, take: 1 } } },
      members: {
        include: { user: { select: { name: true, email: true, lastLoginAt: true } } },
        orderBy: { joinedAt: "asc" },
      },
      vendorRelationships: {
        include: { vendor: { select: { name: true, email: true, status: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          members: true,
          vendorRelationships: true,
          submissions: true,
          auditLogs: true,
        },
      },
    },
  })

  if (!company) notFound()

  const [submissionsByStatus, duplicateAlerts, aiSummaryCount] = await Promise.all([
    prisma.candidateSubmission.groupBy({
      by: ["status"],
      where: { companyId: id },
      _count: true,
    }),
    prisma.duplicateAlert.count({ where: { companyId: id, status: "OPEN" } }),
    prisma.aiSummary.count({
      where: { status: "COMPLETED", profile: { submissions: { some: { companyId: id } } } },
    }),
  ])

  const totalSubmissions = submissionsByStatus.reduce((s, r) => s + r._count, 0)
  const hired = submissionsByStatus.find((s) => s.status === "HIRED")?._count ?? 0
  const approvedVendors = company.vendorRelationships.filter((v) => v.status === "APPROVED").length

  const portalUrl = buildTenantUrl(company.subdomain)

  return (
    <div className="space-y-8">
      <PageHeader
        title={company.name}
        description={`${company.subdomain}.vendorflow.com · Created ${formatDate(company.createdAt)}`}
        breadcrumb={
          <Link href={ROUTES.ADMIN_COMPANIES} className="text-primary hover:underline">
            ← All companies
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4" />
                View portal
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <AdminCompanyActions companyId={id} currentStatus={company.status} />
          </div>
        }
      />

      {/* Status alert */}
      {company.status !== "ACTIVE" && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="font-semibold text-destructive text-sm">
              Company is {company.status.toLowerCase()}
            </p>
            <p className="text-sm text-destructive/80">
              This workspace is not accessible to users.
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Active vendors" value={approvedVendors} subtitle={`${company._count.vendorRelationships} total`} icon={Building2} iconColor="text-blue-500" />
        <KpiCard title="Submissions" value={totalSubmissions} subtitle={`${hired} hired`} icon={UserCheck} iconColor="text-purple-500" />
        <KpiCard title="Team members" value={company._count.members} subtitle="All roles" icon={Users} iconColor="text-teal-500" />
        <KpiCard title="AI summaries" value={aiSummaryCount} subtitle={`${duplicateAlerts} open duplicates`} icon={Shield} iconColor="text-violet-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Company profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Company profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Legal name", value: company.legalName ?? "—" },
                  { label: "Tax ID / GST", value: company.taxId ?? "—" },
                  { label: "Country", value: company.country },
                  { label: "City", value: company.city ?? "—" },
                  { label: "Industry", value: company.industry ?? "—" },
                  { label: "Size", value: company.size ?? "—" },
                  { label: "Currency", value: company.currency },
                  { label: "Timezone", value: company.timezone },
                  { label: "Website", value: company.website ?? "—" },
                  { label: "Subdomain", value: `${company.subdomain}.vendorflow.com` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              {company.subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{company.subscription.plan.displayName}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {company.subscription.billingCycle.toLowerCase()} billing
                      </p>
                    </div>
                    <StatusBadge status={company.subscription.status} type="subscription" showDot />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Stripe customer</p>
                      <p className="font-mono text-xs mt-0.5">{company.subscription.stripeCustomerId ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Active vendors</p>
                      <p className="font-medium mt-0.5">
                        {company.subscription.activeVendorCount} / {company.subscription.plan.maxVendors === -1 ? "∞" : company.subscription.plan.maxVendors}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Period end</p>
                      <p className="font-medium mt-0.5">
                        {company.subscription.currentPeriodEnd ? formatDate(company.subscription.currentPeriodEnd) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Trial ends</p>
                      <p className="font-medium mt-0.5">
                        {company.subscription.trialEndsAt ? formatDate(company.subscription.trialEndsAt) : "—"}
                      </p>
                    </div>
                  </div>
                  {company.subscription.stripeCustomerId && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://dashboard.stripe.com/customers/${company.subscription.stripeCustomerId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <CreditCard className="h-4 w-4" />
                        View in Stripe
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No subscription found.</p>
              )}
            </CardContent>
          </Card>

          {/* Vendors */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">
                Vendors ({company._count.vendorRelationships})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {company.vendorRelationships.map((vc) => (
                  <div key={vc.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold shrink-0">
                      {vc.vendor.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{vc.vendor.name}</p>
                      <p className="text-xs text-muted-foreground">{vc.vendor.email}</p>
                    </div>
                    <StatusBadge status={vc.status} type="vendor" />
                  </div>
                ))}
                {company.vendorRelationships.length === 0 && (
                  <p className="px-6 py-8 text-sm text-muted-foreground text-center">No vendors yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team members */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Team ({company._count.members})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.members.map((m) => (
                <div key={m.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                    </div>
                    <Badge variant={m.role === "COMPANY_ADMIN" ? "purple" : "blue"} className="text-[10px] shrink-0">
                      {m.role === "COMPANY_ADMIN" ? "Admin" : "HM"}
                    </Badge>
                  </div>
                  {m.user.lastLoginAt && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      Last login: {formatDate(m.user.lastLoginAt)}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Branding */}
          {company.branding && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {["primaryColor", "secondaryColor", "accentColor"].map((key) => (
                    <div key={key} className="flex flex-col items-center gap-1">
                      <div
                        className="h-8 w-8 rounded-full border"
                        style={{ backgroundColor: (company.branding as unknown as Record<string, string>)[key] }}
                      />
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {(company.branding as unknown as Record<string, string>)[key]}
                      </span>
                    </div>
                  ))}
                </div>
                {company.branding.tagline && (
                  <p className="text-xs italic text-muted-foreground">"{company.branding.tagline}"</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: "Total submissions", value: totalSubmissions },
                { label: "Hires", value: hired },
                { label: "Open duplicates", value: duplicateAlerts },
                { label: "Audit events", value: company._count.auditLogs },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
