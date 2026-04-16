// lib/s3.ts
// Cloudflare R2 client (S3-compatible).
// Used for all file storage: CVs, logos, vendor documents.
// Pre-signed URLs ensure files are never served through our server —
// clients upload and download directly from R2.

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { FILE_LIMITS } from "@/config/constants"

// R2 uses the S3 client with a custom endpoint
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env["R2_ACCOUNT_ID"]}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env["R2_ACCESS_KEY_ID"] ?? "",
    secretAccessKey: process.env["R2_SECRET_ACCESS_KEY"] ?? "",
  },
})

const BUCKET = process.env["R2_BUCKET_NAME"] ?? "vendorflow-uploads"
const PUBLIC_URL = process.env["R2_PUBLIC_URL"] ?? ""

// ─────────────────────────────────────────────────────────────────────────────
// Key generators — deterministic, tenant-isolated paths
// ─────────────────────────────────────────────────────────────────────────────
export function buildFileKey(opts: {
  type: "cv" | "logo" | "vendor-doc" | "candidate-doc"
  companyId?: string
  vendorId?: string
  profileId?: string
  fileName: string
}): string {
  const timestamp = Date.now()
  const ext = opts.fileName.split(".").pop()?.toLowerCase() ?? "bin"
  const safe = opts.fileName
    .replace(/[^a-z0-9.-]/gi, "-")
    .toLowerCase()
    .slice(0, 80)

  switch (opts.type) {
    case "cv":
      return `candidates/${opts.companyId ?? "platform"}/${opts.profileId ?? "unknown"}/${timestamp}-${safe}`
    case "logo":
      return `logos/${opts.companyId ?? opts.vendorId ?? "unknown"}/${timestamp}.${ext}`
    case "vendor-doc":
      return `vendor-docs/${opts.vendorId ?? "unknown"}/${opts.companyId ?? "platform"}/${timestamp}-${safe}`
    case "candidate-doc":
      return `candidate-docs/${opts.profileId ?? "unknown"}/${timestamp}-${safe}`
    default:
      return `uploads/misc/${timestamp}-${safe}`
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate a pre-signed PUT URL (client uploads directly to R2)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateUploadUrl(opts: {
  key: string
  contentType: string
  maxSizeBytes?: number
  expiresIn?: number // seconds, default 300 (5 min)
}): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const { key, contentType, expiresIn = 300 } = opts

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn })
  const publicUrl = `${PUBLIC_URL}/${key}`

  return { uploadUrl, key, publicUrl }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate a pre-signed GET URL (secure download, 15 min expiry)
// Use this for private files (CVs, compliance docs)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateDownloadUrl(
  key: string,
  expiresIn = 900 // 15 minutes
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  return getSignedUrl(r2Client, command, { expiresIn })
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete a file
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteFile(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Validate file type and size before generating upload URL
// ─────────────────────────────────────────────────────────────────────────────
export function validateFileForUpload(
  fileName: string,
  contentType: string,
  fileSize: number,
  uploadType: "cv" | "logo" | "document"
): { valid: boolean; error?: string } {
  if (uploadType === "cv") {
    if (!FILE_LIMITS.ALLOWED_CV_TYPES.includes(contentType as never)) {
      return { valid: false, error: "CV must be a PDF or Word document (.pdf, .doc, .docx)" }
    }
    if (fileSize > FILE_LIMITS.CV_MAX_SIZE_BYTES) {
      return { valid: false, error: `CV must be smaller than ${FILE_LIMITS.CV_MAX_SIZE_MB}MB` }
    }
  }

  if (uploadType === "logo") {
    if (!FILE_LIMITS.ALLOWED_IMAGE_TYPES.includes(contentType as never)) {
      return { valid: false, error: "Logo must be an image (JPG, PNG, WebP, SVG)" }
    }
    if (fileSize > FILE_LIMITS.LOGO_MAX_SIZE_BYTES) {
      return { valid: false, error: `Logo must be smaller than ${FILE_LIMITS.LOGO_MAX_SIZE_MB}MB` }
    }
  }

  if (uploadType === "document") {
    if (!FILE_LIMITS.ALLOWED_DOCUMENT_TYPES.includes(contentType as never)) {
      return { valid: false, error: "Document must be a PDF or image" }
    }
    if (fileSize > FILE_LIMITS.DOCUMENT_MAX_SIZE_BYTES) {
      return { valid: false, error: `Document must be smaller than ${FILE_LIMITS.DOCUMENT_MAX_SIZE_MB}MB` }
    }
  }

  return { valid: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Extract key from a full R2 URL (for deletion)
// ─────────────────────────────────────────────────────────────────────────────
export function extractKeyFromUrl(url: string): string {
  return url.replace(`${PUBLIC_URL}/`, "")
}
