// app/api/upload/route.ts
// Returns a pre-signed URL so the client can upload directly to R2.
// Never receives the actual file — this keeps our server lean and fast.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateUploadUrl, buildFileKey, validateFileForUpload } from "@/lib/s3"
import { z } from "zod"

const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSize: z.number().positive().max(50 * 1024 * 1024), // max 50MB absolute cap
  uploadType: z.enum(["cv", "logo", "document", "vendor-doc"]),
  // Context for key generation
  companyId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  profileId: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  // Auth check
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Parse and validate request body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = uploadRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request" },
      { status: 400 }
    )
  }

  const { fileName, contentType, fileSize, uploadType, companyId, vendorId, profileId } = parsed.data

  // Validate file constraints
  const typeMap: Record<string, "cv" | "logo" | "document"> = {
    cv: "cv",
    logo: "logo",
    document: "document",
    "vendor-doc": "document",
  }
  const validation = validateFileForUpload(
    fileName,
    contentType,
    fileSize,
    typeMap[uploadType] ?? "document"
  )
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // Build the file key (determines where in R2 the file lives)
  const key = buildFileKey({
    type: uploadType === "vendor-doc" ? "vendor-doc" : uploadType as "cv" | "logo" | "candidate-doc",
    companyId,
    vendorId,
    profileId,
    fileName,
  })

  try {
    const { uploadUrl, publicUrl } = await generateUploadUrl({
      key,
      contentType,
      expiresIn: 300, // 5 minutes to complete the upload
    })

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl,
      // Let the client know where the file will be accessible after upload
      fileUrl: publicUrl,
    })
  } catch (err) {
    console.error("[Upload] Failed to generate pre-signed URL:", err)
    return NextResponse.json(
      { error: "Failed to generate upload URL. Please try again." },
      { status: 500 }
    )
  }
}
