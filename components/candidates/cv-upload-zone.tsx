// components/candidates/cv-upload-zone.tsx
"use client"

import { useCallback, useState } from "react"
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn, formatFileSize } from "@/lib/utils"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface CvUploadZoneProps {
  vendorId: string
  profileId?: string
  onUploadComplete: (fileUrl: string, key: string, fileName: string) => void
  existingFileUrl?: string
  existingFileName?: string
  className?: string
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
}

export function CvUploadZone({
  vendorId,
  profileId,
  onUploadComplete,
  existingFileUrl,
  existingFileName,
  className,
}: CvUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    url: string
    key: string
  } | null>(
    existingFileUrl && existingFileName
      ? { name: existingFileName, url: existingFileUrl, key: "" }
      : null
  )

  const { upload, progress, status, error, reset } = useFileUpload({
    uploadType: "cv",
    vendorId,
    profileId,
    onSuccess: (fileUrl, key, fileName) => {
      setUploadedFile({ name: fileName, url: fileUrl, key })
      onUploadComplete(fileUrl, key, fileName)
    },
  })

  const handleFile = useCallback(
    async (file: File) => {
      // Client-side validation
      const validTypes = Object.keys(ACCEPTED_TYPES)
      if (!validTypes.includes(file.type)) {
        alert("Please upload a PDF or Word document (.pdf, .doc, .docx)")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File must be smaller than 10MB")
        return
      }

      setSelectedFile(file)
      await upload(file)
    },
    [upload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleRemove = () => {
    setUploadedFile(null)
    setSelectedFile(null)
    reset()
  }

  // ── Already uploaded ──────────────────────────────────────────────────────
  if (uploadedFile && status !== "uploading") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-xl border border-success/30 bg-success-muted p-4",
          className
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
          <FileText className="h-5 w-5 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{uploadedFile.name}</p>
          <p className="text-xs text-success mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Uploaded successfully
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {uploadedFile.url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer">
                View
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ── Uploading ─────────────────────────────────────────────────────────────
  if (status === "uploading" && selectedFile) {
    return (
      <div className={cn("rounded-xl border bg-card p-6 space-y-4", className)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
          <span className="text-sm font-semibold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <p className="text-xs text-muted-foreground text-center">Uploading securely…</p>
      </div>
    )
  }

  // ── Drop zone ─────────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-3", className)}>
      <label
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="sr-only"
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
        />

        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl mb-4 transition-colors",
          isDragging ? "bg-primary/20" : "bg-secondary group-hover:bg-primary/10"
        )}>
          <Upload className={cn(
            "h-6 w-6 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          )} />
        </div>

        <p className="text-sm font-medium text-foreground mb-1">
          {isDragging ? "Drop your CV here" : "Drag & drop CV here"}
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          or click to browse from your computer
        </p>
        <p className="text-xs text-muted-foreground/60">
          PDF, DOC, or DOCX · Max 10MB
        </p>
      </label>

      {/* Error */}
      {status === "error" && error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
