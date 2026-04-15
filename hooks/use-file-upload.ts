// hooks/use-file-upload.ts
"use client"

import { useState, useCallback } from "react"

interface UploadState {
  progress: number // 0-100
  status: "idle" | "uploading" | "success" | "error"
  fileUrl: string | null
  key: string | null
  error: string | null
}

interface UseFileUploadOptions {
  uploadType: "cv" | "logo" | "document" | "vendor-doc"
  companyId?: string
  vendorId?: string
  profileId?: string
  onSuccess?: (fileUrl: string, key: string, fileName: string) => void
  onError?: (error: string) => void
}

export function useFileUpload(options: UseFileUploadOptions) {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    status: "idle",
    fileUrl: null,
    key: null,
    error: null,
  })

  const upload = useCallback(
    async (file: File): Promise<{ fileUrl: string; key: string } | null> => {
      setState({ progress: 0, status: "uploading", fileUrl: null, key: null, error: null })

      try {
        // Step 1: Get pre-signed upload URL from our API
        const metaRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
            uploadType: options.uploadType,
            companyId: options.companyId,
            vendorId: options.vendorId,
            profileId: options.profileId,
          }),
        })

        if (!metaRes.ok) {
          const err = await metaRes.json().catch(() => ({ error: "Upload failed" }))
          throw new Error(err.error ?? "Failed to get upload URL")
        }

        const { uploadUrl, key, fileUrl } = await metaRes.json()

        // Step 2: Upload directly to R2 using XHR (for progress tracking)
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100)
              setState((prev) => ({ ...prev, progress: percent }))
            }
          })

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          })

          xhr.addEventListener("error", () => reject(new Error("Network error during upload")))
          xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")))

          xhr.open("PUT", uploadUrl)
          xhr.setRequestHeader("Content-Type", file.type)
          xhr.send(file)
        })

        setState({ progress: 100, status: "success", fileUrl, key, error: null })
        options.onSuccess?.(fileUrl, key, file.name)
        return { fileUrl, key }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed"
        setState((prev) => ({ ...prev, status: "error", error: message, progress: 0 }))
        options.onError?.(message)
        return null
      }
    },
    [options]
  )

  const reset = useCallback(() => {
    setState({ progress: 0, status: "idle", fileUrl: null, key: null, error: null })
  }, [])

  return { ...state, upload, reset }
}
