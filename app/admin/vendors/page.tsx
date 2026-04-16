// app/admin/vendors/page.tsx
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Search, Building2, Star } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "All Vendors — Admin" }

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.q ?? ""
  const statusFilter = params.status ?? ""
  const page = parseInt(params.page ?? "1")
  const pageSize = 25

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(statusFilter && { status: statusFilter as "APPROVED" | "PENDING" | "REJECTED" | "SUSPENDED" }),
  }

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { companyRelationships: true, candidates: true },
        },
      },
    }),
    prisma.vendor.count({ where }),
  ])

  const statusCounts = await prisma.vendor.groupBy({
    by: ["status"],
    _count: true,
  })
  const countMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]))
  const totalPages = Math.ceil(total / pageSize)

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
        title="All Vendors"
        description={`${total.toLocaleString()} vendors registered on the platform`}
      />

      {/* Status tabs */}
      <div className="flex gap-1 border-b overflow-x-auto no-scrollbar">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value
          const count = tab.value ? countMap[tab.value] : undefined
          return (
            <Link
              key={tab.value}
              href={`/admin/vendors${tab.value ? `?status=${tab.value}` : ""}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count !== undefined && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${isActive ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Search */}
      <form className="flex gap-3 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search vendors..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" size="sm" variant="outline">Search</Button>
      </form>

      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b bg-secondary/30">
            <span className="col-span-4">Vendor</span>
            <span className="col-span-2">Country</span>
            <span className="col-span-2 text-center">Companies</span>
            <span className="col-span-2 text-center">Candidates</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1">Joined</span>
          </div>

          {vendors.length === 0 && (
            <div className="py-16 text-center">
              <Building2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No vendors found.</p>
            </div>
          )}

          <div className="divide-y">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="grid grid-cols-12 gap-3 px-6 py-3.5 items-center text-sm hover:bg-muted/20">
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {vendor.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{vendor.email}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-muted-foreground">{vendor.country}</div>
                <div className="col-span-2 text-center font-semibold">{vendor._count.companyRelationships}</div>
                <div className="col-span-2 text-center font-semibold">{vendor._count.candidates}</div>
                <div className="col-span-1">
                  <StatusBadge status={vendor.status} type="vendor" />
                </div>
                <div className="col-span-1 text-xs text-muted-foreground">
                  {formatDate(vendor.createdAt)}
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
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/vendors?page=${page - 1}${search ? `&q=${search}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`}>
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/vendors?page=${page + 1}${search ? `&q=${search}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`}>
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
