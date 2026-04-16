// app/admin/companies/page.tsx
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ArrowRight, Building2, Globe, Search } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "All Companies — Admin" }

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.q ?? ""
  const statusFilter = params.status ?? ""
  const page = parseInt(params.page ?? "1", 10)
  const pageSize = 20

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { slug: { contains: search, mode: "insensitive" as const } },
        { legalName: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(statusFilter && { status: statusFilter as "ACTIVE" | "SUSPENDED" | "DELETED" }),
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        subscription: { include: { plan: { select: { displayName: true } } } },
        _count: {
          select: {
            members: true,
            vendorRelationships: true,
            submissions: true,
          },
        },
      },
    }),
    prisma.company.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Companies"
        description={`${total} total companies on the platform`}
      />

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <form className="flex-1 relative max-w-sm" method="GET">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by name or subdomain..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </form>
        <div className="flex gap-2">
          {["", "ACTIVE", "SUSPENDED"].map((s) => (
            <Link
              key={s}
              href={`/admin/companies${s ? `?status=${s}` : ""}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-4">Company</span>
              <span className="col-span-2">Plan</span>
              <span className="col-span-2 text-center">Vendors</span>
              <span className="col-span-2 text-center">Submissions</span>
              <span className="col-span-1">Status</span>
              <span className="col-span-1" />
            </div>

            {companies.length === 0 && (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No companies found.
              </div>
            )}

            {companies.map((company) => (
              <div
                key={company.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors"
              >
                {/* Company name */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {company.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{company.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <a
                        href={`https://${company.subdomain}.vendorflow.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {company.subdomain}.vendorflow.com
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground/60">{formatDate(company.createdAt)}</p>
                  </div>
                </div>

                {/* Plan */}
                <div className="col-span-2">
                  {company.subscription ? (
                    <div>
                      <p className="text-sm font-medium">{company.subscription.plan.displayName}</p>
                      <StatusBadge
                        status={company.subscription.status}
                        type="subscription"
                        className="text-[10px] mt-0.5"
                      />
                    </div>
                  ) : (
                    <Badge variant="gray" className="text-xs">No plan</Badge>
                  )}
                </div>

                {/* Vendors */}
                <div className="col-span-2 text-center">
                  <span className="text-sm font-semibold">{company._count.vendorRelationships}</span>
                  {company.subscription && (
                    <p className="text-xs text-muted-foreground">
                      of {company.subscription.activeVendorCount}
                    </p>
                  )}
                </div>

                {/* Submissions */}
                <div className="col-span-2 text-center">
                  <span className="text-sm font-semibold">{company._count.submissions}</span>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <Badge
                    variant={company.status === "ACTIVE" ? "green" : company.status === "SUSPENDED" ? "red" : "gray"}
                    className="text-xs"
                  >
                    {company.status.toLowerCase()}
                  </Badge>
                </div>

                {/* Action */}
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link href={`/admin/companies/${company.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/companies?page=${page - 1}${search ? `&q=${search}` : ""}`}>
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/companies?page=${page + 1}${search ? `&q=${search}` : ""}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
