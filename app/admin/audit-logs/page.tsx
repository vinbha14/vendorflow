// app/admin/audit-logs/page.tsx
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ScrollText, Search } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Audit Logs — Admin" }

// Color-code by action prefix
function getActionColor(action: string): string {
  if (action.includes("CREATED") || action.includes("APPROVED") || action.includes("HIRED")) return "green"
  if (action.includes("DELETED") || action.includes("REJECTED") || action.includes("SUSPENDED") || action.includes("FAILED") || action.includes("CANCELED")) return "red"
  if (action.includes("UPDATED") || action.includes("CHANGED") || action.includes("UPGRADED")) return "blue"
  if (action.includes("INVITED") || action.includes("SUBMITTED")) return "purple"
  if (action.includes("IMPERSONATED")) return "amber"
  return "gray"
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.q ?? ""
  const actionFilter = params.action ?? ""
  const page = parseInt(params.page ?? "1", 10)
  const pageSize = 50

  const where = {
    ...(actionFilter && { action: { contains: actionFilter, mode: "insensitive" as const } }),
    ...(search && {
      OR: [
        { actorEmail: { contains: search, mode: "insensitive" as const } },
        { action: { contains: search, mode: "insensitive" as const } },
        { entity: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        actor: { select: { name: true } },
        company: { select: { name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description={`${total.toLocaleString()} total events recorded`}
      />

      {/* Search */}
      <form className="flex gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by actor, action, entity…"
            className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" size="sm" variant="outline">Search</Button>
      </form>

      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b">
            <span className="col-span-2">Time</span>
            <span className="col-span-2">Actor</span>
            <span className="col-span-3">Action</span>
            <span className="col-span-2">Entity</span>
            <span className="col-span-2">Company</span>
            <span className="col-span-1">IP</span>
          </div>

          {logs.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <ScrollText className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              No audit events found.
            </div>
          )}

          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="grid grid-cols-12 gap-3 px-6 py-3 items-start text-sm hover:bg-muted/20 transition-colors">
                <div className="col-span-2 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("en-US", {
                    month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="text-xs font-medium truncate">{log.actor.name ?? log.actorEmail}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{log.actorRole}</p>
                  {log.isImpersonated && (
                    <Badge variant="amber" className="text-[10px] mt-0.5">impersonated</Badge>
                  )}
                </div>
                <div className="col-span-3">
                  <Badge
                    variant={getActionColor(log.action) as Parameters<typeof Badge>[0]["variant"]}
                    className="text-[10px] font-mono"
                  >
                    {log.action}
                  </Badge>
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="text-xs font-medium">{log.entity}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {log.entityId.slice(0, 8)}…
                  </p>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground truncate">
                  {log.company?.name ?? "Platform"}
                </div>
                <div className="col-span-1 text-[10px] text-muted-foreground font-mono truncate">
                  {log.ipAddress ?? "—"}
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
                <Link href={`/admin/audit-logs?page=${page - 1}${search ? `&q=${search}` : ""}`}>Previous</Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/audit-logs?page=${page + 1}${search ? `&q=${search}` : ""}`}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
