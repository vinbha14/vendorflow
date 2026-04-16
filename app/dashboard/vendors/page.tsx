// app/dashboard/vendors/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import {
  Building2, Plus, ArrowRight, Star, Users,
  CheckCircle2, Clock, XCircle,
} from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Vendors" }

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  const statusFilter = params.status

  const vendorRelationships = await prisma.vendorCompany.findMany({
    where: {
      companyId: tenantId,
      ...(statusFilter && { status: statusFilter as "APPROVED" | "PENDING" | "REJECTED" }),
    },
    orderBy: [
      { status: "asc" }, // APPROVED first
      { approvedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          email: true,
          logoUrl: true,
          country: true,
          serviceCategories: true,
          totalSubmissions: true,
          overallRating: true,
        },
      },
    },
  })

  // Count by status
  const allRelationships = await prisma.vendorCompany.groupBy({
    by: ["status"],
    where: { companyId: tenantId },
    _count: true,
  })
  const countByStatus = Object.fromEntries(allRelationships.map((r) => [r.status, r._count]))

  const STATUS_TABS = [
    { label: "All", value: "" },
    { label: "Approved", value: "APPROVED" },
    { label: "Pending", value: "PENDING" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Suspended", value: "SUSPENDED" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description={`${vendorRelationships.length} vendor relationships`}
        actions={
          <Button asChild>
            <Link href={ROUTES.DASHBOARD_VENDORS_INVITE}>
              <Plus className="h-4 w-4" />
              Invite vendor
            </Link>
          </Button>
        }
      />

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value || (!statusFilter && tab.value === "")
          const count = tab.value ? countByStatus[tab.value] : undefined
          return (
            <Link
              key={tab.value}
              href={`${ROUTES.DASHBOARD_VENDORS}${tab.value ? `?status=${tab.value}` : ""}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count !== undefined && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                  isActive ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                }`}>{count}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Vendor grid */}
      {vendorRelationships.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No vendors yet"
          description="Invite your first vendor partner to start receiving candidates."
          action={{ label: "Invite vendor", href: ROUTES.DASHBOARD_VENDORS_INVITE }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendorRelationships.map((rel) => (
            <Link
              key={rel.id}
              href={`${ROUTES.DASHBOARD_VENDORS}/${rel.vendor.id}`}
              className="group rounded-xl border bg-card p-5 hover:shadow-card-hover hover:border-primary/20 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {rel.vendor.logoUrl ? (
                    <img src={rel.vendor.logoUrl} alt={rel.vendor.name} className="h-10 w-10 rounded-lg object-contain border bg-white" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {rel.vendor.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{rel.vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{rel.vendor.country}</p>
                  </div>
                </div>
                <StatusBadge status={rel.status} type="vendor" showDot />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div>
                  <p className="text-lg font-bold">{rel.submissionsCount}</p>
                  <p className="text-[10px] text-muted-foreground">Submitted</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{rel.acceptedCount}</p>
                  <p className="text-[10px] text-muted-foreground">Accepted</p>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {rel.submissionsCount > 0
                      ? `${Math.round((rel.acceptedCount / rel.submissionsCount) * 100)}%`
                      : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Success rate</p>
                </div>
              </div>

              {/* Rating */}
              {rel.rating !== null && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium">{rel.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">your rating</span>
                </div>
              )}

              {/* Categories */}
              {rel.vendor.serviceCategories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rel.vendor.serviceCategories.slice(0, 2).map((cat) => (
                    <span key={cat} className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {cat}
                    </span>
                  ))}
                  {rel.vendor.serviceCategories.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">+{rel.vendor.serviceCategories.length - 2}</span>
                  )}
                </div>
              )}

              {/* Pending approval CTA */}
              {rel.status === "PENDING" && (
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button size="sm" className="flex-1 h-7 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:text-destructive">
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              )}

              {rel.approvedAt && rel.status === "APPROVED" && (
                <p className="text-[10px] text-muted-foreground mt-3">
                  Approved {formatDate(rel.approvedAt)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
