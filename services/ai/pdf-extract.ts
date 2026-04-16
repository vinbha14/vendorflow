// services/ai/pdf-extract.ts
// Extracts raw text from uploaded CVs (PDF and DOCX).
// Text is stored on the CandidateProfile.resumeText field
// and then fed into the AI summarization pipeline.
//
// Strategy:
// 1. Download file from R2 using the stored URL
// 2. Detect file type from URL or content-type
// 3. Extract text using pdf-parse (PDF) or mammoth (DOCX)
// 4. Clean and normalize the text
// 5. Store on the profile record

import { prisma } from "@/lib/prisma"
import { truncateToTokenBudget } from "@/lib/openai"
import { AI_CONFIG } from "@/config/constants"

// ─────────────────────────────────────────────────────────────────────────────
// Main: Extract text from a CV file and save to the profile
// ─────────────────────────────────────────────────────────────────────────────
export async function extractAndStoreCvText(
  profileId: string
): Promise<{ success: boolean; charCount?: number; error?: string }> {
  const profile = await prisma.candidateProfile.findUnique({
    where: { id: profileId },
    select: { resumeUrl: true, resumeText: true },
  })

  if (!profile) return { success: false, error: "Profile not found" }
  if (!profile.resumeUrl) return { success: false, error: "No CV file uploaded" }
  if (profile.resumeText) return { success: true, charCount: profile.resumeText.length } // Already extracted

  try {
    const text = await extractTextFromUrl(profile.resumeUrl)
    if (!text || text.trim().length < 50) {
      return { success: false, error: "Could not extract meaningful text from the CV" }
    }

    // Clean and truncate to token budget
    const cleaned = cleanExtractedText(text)
    const truncated = truncateToTokenBudget(cleaned, AI_CONFIG.MAX_RESUME_TOKENS)

    await prisma.candidateProfile.update({
      where: { id: profileId },
      data: { resumeText: truncated },
    })

    return { success: true, charCount: truncated.length }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed"
    console.error(`[PDF Extract] Failed for profile ${profileId}:`, err)
    return { success: false, error: message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Download file from URL and extract text
// ─────────────────────────────────────────────────────────────────────────────
async function extractTextFromUrl(url: string): Promise<string> {
  // Download the file
  const response = await fetch(url, {
    headers: { Accept: "*/*" },
    // 30 second timeout
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    throw new Error(`Failed to download CV: ${response.status} ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get("content-type") ?? ""
  const urlLower = url.toLowerCase()

  // Determine file type
  const isPdf =
    contentType.includes("pdf") ||
    urlLower.endsWith(".pdf")

  const isDocx =
    contentType.includes("openxmlformats") ||
    contentType.includes("msword") ||
    urlLower.endsWith(".docx") ||
    urlLower.endsWith(".doc")

  if (isPdf) {
    return extractFromPdf(buffer)
  } else if (isDocx) {
    return extractFromDocx(buffer)
  } else {
    // Try PDF first, then DOCX as fallback
    try {
      return await extractFromPdf(buffer)
    } catch {
      return extractFromDocx(buffer)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF extraction using pdf-parse
// ─────────────────────────────────────────────────────────────────────────────
async function extractFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues with Next.js edge runtime
  const pdfParse = (await import("pdf-parse")).default
  const data = await pdfParse(buffer, {
    // Limit pages to prevent huge CV files from blowing memory
    max: 10,
  })
  return data.text
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCX extraction using mammoth
// ─────────────────────────────────────────────────────────────────────────────
async function extractFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default
  const result = await mammoth.extractRawText({ buffer })

  if (result.messages.length > 0) {
    console.warn("[PDF Extract] Mammoth warnings:", result.messages.slice(0, 3))
  }

  return result.value
}

// ─────────────────────────────────────────────────────────────────────────────
// Clean extracted text — normalize whitespace, remove garbage chars
// ─────────────────────────────────────────────────────────────────────────────
function cleanExtractedText(raw: string): string {
  return raw
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove null bytes and other control characters except newlines/tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Collapse more than 3 consecutive blank lines into 2
    .replace(/\n{4,}/g, "\n\n\n")
    // Collapse more than 3 consecutive spaces into 2
    .replace(/ {4,}/g, "   ")
    // Remove lines that are purely noise (single characters, page numbers)
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim()
      // Keep empty lines (for paragraph structure)
      if (trimmed.length === 0) return true
      // Remove single-character lines that aren't meaningful
      if (trimmed.length === 1 && !/[A-Za-z]/.test(trimmed)) return false
      // Remove lines that are just numbers (page numbers)
      if (/^\d{1,3}$/.test(trimmed)) return false
      return true
    })
    .join("\n")
    .trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse structured data from extracted text (best-effort)
// Used to pre-fill profile fields from CV content
// ─────────────────────────────────────────────────────────────────────────────
export function parseStructuredDataFromText(text: string): {
  email?: string
  phone?: string
  linkedinUrl?: string
  skills: string[]
} {
  const result: ReturnType<typeof parseStructuredDataFromText> = { skills: [] }

  // Email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  if (emailMatch) result.email = emailMatch[0]

  // Phone (Indian + international formats)
  const phoneMatch = text.match(
    /(?:\+?91[-.\s]?)?(?:\(?[0-9]{3,5}\)?[-.\s]?)?[0-9]{3,5}[-.\s]?[0-9]{4,5}/
  )
  if (phoneMatch) result.phone = phoneMatch[0]?.trim()

  // LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i)
  if (linkedinMatch) result.linkedinUrl = `https://${linkedinMatch[0]}`

  // Skills (common tech skills extraction)
  const commonSkills = [
    "React", "Angular", "Vue", "Node.js", "Python", "Java", "TypeScript",
    "JavaScript", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "SQL",
    "PostgreSQL", "MongoDB", "GraphQL", "REST", "Microservices", "Git",
    "CI/CD", "DevOps", "Machine Learning", "TensorFlow", "PyTorch",
    "Spring Boot", "Django", "FastAPI", "Express", "Next.js", "Go",
    "Rust", "C++", "C#", ".NET", "Redis", "Kafka", "Spark", "Terraform",
    "Jenkins", "GitHub Actions", "Agile", "Scrum", "Jira",
  ]
  result.skills = commonSkills.filter((skill) =>
    new RegExp(`\\b${skill.replace(".", "\\.").replace("+", "\\+")}\\b`, "i").test(text)
  )

  return result
}
