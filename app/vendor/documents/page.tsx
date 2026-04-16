// app/vendor/documents/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { VendorDocumentUpload } from "@/components/vendor/vendor-document-upload"
import { FileText, CheckCircle2, Clock, XCircle, Download } from "lucide-react"
import { formatDate } from "@/lib/utils"

export const metadata = { title: "Documents" }

const DOC_TYPE_LABELS: Record<string, string> = {
  GST_CERTIFICATE: "GST Certificate",
  PAN_CARD: "PAN Card",
  BUSINESS_REGISTRATION: "Business Registration",
  BANK_DETAILS: "Bank Details",
  TRADE_LICENSE: "Trade License",
  ISO_CERTIFICATE: "ISO Certificate",
  OTHER: "Other Document",
}

export default async function VendorDocumentsPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id, isActive: true },
  })
  if (!vendorUser) redirect(ROUTES.SIGN_IN)

  const documents = await prisma.vendorDocument.findMany({
    where: { vendorId: vendorUser.vendorId, companyId: null },
    orderBy: { uploadedAt: "desc" },
  })

  const pendingCount = documents.filter((d) => d.status === "PENDING").length
  const verifiedCount = documents.filter((d) => d.status === "VERIFIED").length

  const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
    PENDING: Clock,
    VERIFIED: CheckCircle2,
    REJECTED: XCircle,
  }

  const STATUS_COLOR: Record<string, string> = {
    PENDING: "text-amber-600",
    VERIFIED: "text-green-600",
    REJECTED: "text-red-600",
  }

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        title="Compliance Documents"
        description={`${verifiedCount} verified${pendingCount > 0 ? ` · ${pendingCount} pending review` : ""}`}
      />

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Verified", count: verifiedCount, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending", count: pendingCount, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total", count: documents.length, color: "text-foreground", bg: "bg-secondary" },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-4 ${item.bg}`}>
            <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Upload new document */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Upload document</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorDocumentUpload vendorId={vendorUser.vendorId} />
          <p className="text-xs text-muted-foreground mt-3">
            Upload your business compliance documents for verification. Accepted formats: PDF, JPG, PNG. Max 25MB.
          </p>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Uploaded documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload your GST certificate, PAN card, or business registration to get verified."
              size="sm"
            />
          ) : (
            <div className="divide-y">
              {documents.map((doc) => {
                const StatusIcon = STATUS_ICON[doc.status] ?? Clock
                return (
                  <div key={doc.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {DOC_TYPE_LABELS[doc.docType] ?? doc.docType} · Uploaded {formatDate(doc.uploadedAt)}
                      </p>
                      {doc.rejectedReason && (
                        <p className="text-xs text-destructive mt-0.5">{doc.rejectedReason}</p>
                      )}
                      {doc.expiresAt && (
                        <p className="text-xs text-muted-foreground">Expires {formatDate(doc.expiresAt)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${STATUS_COLOR[doc.status] ?? "text-muted-foreground"}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {doc.status.charAt(0) + doc.status.slice(1).toLowerCase()}
                      </div>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
