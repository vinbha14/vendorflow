// app/dashboard/audit-logs/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollText } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import Link from "next/link"

export const metadata = { title: "Audit Logs" }

const ACTION_COLORS: Record<string, string> = {
  APPROVED: "green", HIRED: "green", CREATED: "green",
  REJECTED: "red", FAILED: "red", CANCELED: "red", SUSPENDED: "red",
  INVITED: "blue", SUBMITTED: "blue", UPDATED: "blue",
  CHANGED: "amber", SHORTLISTED: "purple",
}

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) => action.includes(k))
  return ACTION_COLORS[key ?? ""] ?? "gray"
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  // Only company admins can view audit logs
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: tenantId } },
  })
  if (!membership || membership.role !== "COMPANY_ADMIN") redirect(ROUTES.DASHBOARD)

  const page = parseInt(params.page ?? "1")
  const pageSize = 50
  const skip = (page - 1) * pageSize

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { companyId: tenantId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where: { companyId: tenantId } }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description={`${total.toLocaleString()} events recorded in this workspace`}
      />

      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b bg-secondary/30">
            <span className="col-span-2">Time</span>
            <span className="col-span-2">Actor</span>
            <span className="col-span-3">Action</span>
            <span className="col-span-3">Entity</span>
            <span className="col-span-2">IP</span>
          </div>

          {logs.length === 0 && (
            <div className="py-16 text-center">
              <ScrollText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No audit events yet.</p>
            </div>
          )}

          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="grid grid-cols-12 gap-3 px-6 py-3.5 items-start text-sm hover:bg-muted/20">
                <div className="col-span-2 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="text-xs font-medium truncate">{log.actor.name ?? log.actorEmail}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{log.actorRole.toLowerCase().replace("_", " ")}</p>
                </div>
                <div className="col-span-3">
                  <Badge
                    variant={getActionColor(log.action) as Parameters<typeof Badge>[0]["variant"]}
                    className="text-[10px] font-mono"
                  >
                    {log.action}
                  </Badge>
                </div>
                <div className="col-span-3 min-w-0">
                  <p className="text-xs font-medium">{log.entity}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {log.entityId.length > 12 ? `${log.entityId.slice(0, 8)}…` : log.entityId}
                  </p>
                </div>
                <div className="col-span-2 text-[10px] text-muted-foreground font-mono truncate">
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
            Showing {skip + 1}–{Math.min(skip + pageSize, total)} of {total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`${ROUTES.DASHBOARD_AUDIT_LOGS}?page=${page - 1}`}>Previous</Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`${ROUTES.DASHBOARD_AUDIT_LOGS}?page=${page + 1}`}>Next</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
