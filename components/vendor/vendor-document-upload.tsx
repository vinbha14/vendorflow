// components/vendor/vendor-document-upload.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const DOC_TYPES = [
  { value: "GST_CERTIFICATE", label: "GST Certificate" },
  { value: "PAN_CARD", label: "PAN Card" },
  { value: "BUSINESS_REGISTRATION", label: "Business Registration" },
  { value: "BANK_DETAILS", label: "Bank Details" },
  { value: "TRADE_LICENSE", label: "Trade License" },
  { value: "ISO_CERTIFICATE", label: "ISO Certificate" },
  { value: "OTHER", label: "Other" },
]

export function VendorDocumentUpload({ vendorId }: { vendorId: string }) {
  const router = useRouter()
  const [docType, setDocType] = useState("GST_CERTIFICATE")
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const { upload, status, progress, error, reset } = useFileUpload({
    uploadType: "vendor-doc",
    vendorId,
    onSuccess: async (fileUrl, key, fileName) => {
      // Save document record
      startTransition(async () => {
        await fetch("/api/vendor/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorId, fileUrl, fileName, docType }),
        })
        setSaved(true)
        setTimeout(() => {
          setSaved(false)
          reset()
          router.refresh()
        }, 2000)
      })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  if (saved) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-success-muted border border-success/30 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <p className="text-sm font-medium text-success">Document uploaded and saved!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Document type</Label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <label
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all",
          status === "uploading" ? "opacity-50 pointer-events-none" : "hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          type="file"
          className="sr-only"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          disabled={status === "uploading"}
        />
        {status === "uploading" ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading… {progress}%</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            <div>
              <p className="text-sm font-medium">Click to upload document</p>
              <p className="text-xs text-muted-foreground">PDF, JPG, or PNG · Max 25MB</p>
            </div>
          </>
        )}
      </label>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
