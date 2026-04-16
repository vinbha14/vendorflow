// app/dashboard/vendors/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VendorActionButtons } from "@/components/vendor/vendor-action-buttons"
import { formatDate } from "@/lib/utils"
import { Building2, Mail, Phone, Globe, MapPin, Star, FileText } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Vendor Profile" }

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  const vendorRelationship = await prisma.vendorCompany.findUnique({
    where: { vendorId_companyId: { vendorId: id, companyId: tenantId } },
    include: {
      vendor: {
        include: {
          documents: { where: { companyId: tenantId } },
          users: { include: { user: { select: { name: true, email: true } } }, take: 5 },
        },
      },
    },
  })

  if (!vendorRelationship) notFound()

  const { vendor } = vendorRelationship

  const submissions = await prisma.candidateSubmission.findMany({
    where: { vendorId: id, companyId: tenantId },
    orderBy: { submittedAt: "desc" },
    take: 10,
    include: {
      profile: { select: { fullName: true, currentTitle: true, skills: true } },
    },
  })

  const isAdmin = (await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: tenantId } },
  }))?.role === "COMPANY_ADMIN"

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        title={vendor.name}
        description={`${vendorRelationship.submissionsCount} submissions · ${vendorRelationship.acceptedCount} accepted`}
        breadcrumb={<Link href={ROUTES.DASHBOARD_VENDORS} className="text-primary hover:underline">← Vendors</Link>}
        actions={
          isAdmin && (
            <VendorActionButtons
              vendorId={id}
              companyId={tenantId}
              currentStatus={vendorRelationship.status}
            />
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor profile */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {vendor.logoUrl ? (
                    <img src={vendor.logoUrl} alt={vendor.name} className="h-16 w-16 rounded-xl object-contain border bg-white p-1" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
                      {vendor.name[0]}
                    </div>
                  )}
                  <div>
                    <h2 className="font-semibold text-lg">{vendor.name}</h2>
                    {vendor.legalName && <p className="text-sm text-muted-foreground">{vendor.legalName}</p>}
                    <StatusBadge status={vendorRelationship.status} type="vendor" showDot className="mt-1" />
                  </div>
                </div>
                {vendorRelationship.rating !== null && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{vendorRelationship.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendor.description && (
                <p className="text-sm text-muted-foreground">{vendor.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Mail, label: vendor.email },
                  ...(vendor.phone ? [{ icon: Phone, label: vendor.phone }] : []),
                  ...(vendor.website ? [{ icon: Globe, label: vendor.website }] : []),
                  ...(vendor.city || vendor.country ? [{ icon: MapPin, label: [vendor.city, vendor.country].filter(Boolean).join(", ") }] : []),
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{label}</span>
                  </div>
                ))}
              </div>
              {vendor.serviceCategories.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Service categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vendor.serviceCategories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {vendor.taxId && (
                <p className="text-xs text-muted-foreground">Tax ID / GST: <span className="font-mono">{vendor.taxId}</span></p>
              )}
            </CardContent>
          </Card>

          {/* Recent submissions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Recent submissions ({submissions.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {submissions.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground text-center">No submissions yet.</p>
              ) : (
                <div className="divide-y">
                  {submissions.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`${ROUTES.DASHBOARD_CANDIDATES}/${sub.id}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold shrink-0">
                        {(sub.profile.fullName[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{sub.profile.fullName}</p>
                        <p className="text-xs text-muted-foreground">{sub.profile.currentTitle}</p>
                      </div>
                      <StatusBadge status={sub.status} type="submission" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Performance</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Total submitted", value: vendorRelationship.submissionsCount },
                { label: "Accepted", value: vendorRelationship.acceptedCount },
                { label: "Success rate", value: vendorRelationship.submissionsCount > 0 ? `${Math.round((vendorRelationship.acceptedCount / vendorRelationship.submissionsCount) * 100)}%` : "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
              {vendorRelationship.approvedAt && (
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Approved {formatDate(vendorRelationship.approvedAt)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Documents ({vendor.documents.length})</CardTitle></CardHeader>
            <CardContent>
              {vendor.documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No documents uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {vendor.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs hover:text-primary transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{doc.fileName}</span>
                      <Badge variant={doc.status === "VERIFIED" ? "green" : doc.status === "REJECTED" ? "red" : "amber"} className="text-[10px] shrink-0">
                        {doc.status.toLowerCase()}
                      </Badge>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team contacts */}
          {vendor.users.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Contacts</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {vendor.users.map((vu) => (
                  <div key={vu.id} className="text-sm">
                    <p className="font-medium">{vu.user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{vu.user.email}</p>
                    <Badge variant="secondary" className="text-[10px] mt-0.5">{vu.role}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
