// services/company.service.ts
"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isSubdomainAvailable } from "@/lib/tenant"
import { AUDIT_ACTIONS } from "@/config/constants"
import { headers } from "next/headers"
import { z } from "zod"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { generateSlug } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────
const companyDetailsSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters").max(100),
  legalName: z.string().optional(),
  country: z.string().min(2).max(2),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  industry: z.string().optional(),
  size: z.string().optional(),
  currency: z.string().min(3).max(3),
  timezone: z.string(),
})

const brandingSchema = z.object({
  companyId: z.string().uuid(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  tagline: z.string().max(120).optional(),
  description: z.string().max(1000).optional(),
  supportEmail: z.string().email().optional().or(z.literal("")),
})

const subdomainSchema = z.object({
  companyId: z.string().uuid(),
  subdomain: z
    .string()
    .min(3, "Minimum 3 characters")
    .max(50, "Maximum 50 characters")
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/, "Lowercase letters, numbers, and hyphens only"),
})

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Create company workspace
// ─────────────────────────────────────────────────────────────────────────────
export async function createCompanyWorkspace(
  rawInput: z.infer<typeof companyDetailsSchema>
): Promise<{ success: boolean; companyId?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const parsed = companyDetailsSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const data = parsed.data

  // Check if user already has a company
  const existingMembership = await prisma.companyMember.findFirst({
    where: { userId: session.user.id, isActive: true },
  })
  if (existingMembership) {
    return { success: false, error: "You are already part of a company workspace." }
  }

  // Generate initial slug from company name
  const baseSlug = generateSlug(data.name)
  let slug = baseSlug
  let attempt = 0

  // Ensure slug is unique
  while (!(await isSubdomainAvailable(slug))) {
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  // Create company + branding + admin member in a transaction
  const company = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: data.name,
        slug,
        subdomain: slug,
        legalName: data.legalName,
        country: data.country,
        state: data.state,
        city: data.city,
        address: data.address,
        postalCode: data.postalCode,
        taxId: data.taxId,
        website: data.website || undefined,
        industry: data.industry,
        size: data.size,
        currency: data.currency,
        timezone: data.timezone,
        status: "ACTIVE",
      },
    })

    // Create default branding
    await tx.companyBranding.create({
      data: {
        companyId: company.id,
        primaryColor: "#4F46E5",
        secondaryColor: "#818CF8",
        accentColor: "#C7D2FE",
      },
    })

    // Add user as company admin
    await tx.companyMember.create({
      data: {
        userId: session.user.id,
        companyId: company.id,
        role: "COMPANY_ADMIN",
        isActive: true,
      },
    })

    return company
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: "COMPANY_ADMIN",
      action: AUDIT_ACTIONS.COMPANY_CREATED,
      entity: "Company",
      entityId: company.id,
      after: { name: company.name, slug: company.slug },
      ipAddress: await getClientIp(),
    },
  })

  return { success: true, companyId: company.id }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Save branding
// ─────────────────────────────────────────────────────────────────────────────
export async function saveCompanyBranding(
  rawInput: z.infer<typeof brandingSchema>
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const parsed = brandingSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }
  }

  const { companyId, ...brandingData } = parsed.data

  // Verify the user is admin of this company
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!membership || membership.role !== "COMPANY_ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  await prisma.companyBranding.upsert({
    where: { companyId },
    update: brandingData,
    create: { companyId, ...brandingData },
  })

  await prisma.auditLog.create({
    data: {
      companyId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: "COMPANY_ADMIN",
      action: AUDIT_ACTIONS.COMPANY_BRANDING_UPDATED,
      entity: "CompanyBranding",
      entityId: companyId,
      after: brandingData,
      ipAddress: await getClientIp(),
    },
  })

  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Set subdomain
// ─────────────────────────────────────────────────────────────────────────────
export async function setCompanySubdomain(
  rawInput: z.infer<typeof subdomainSchema>
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const parsed = subdomainSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid subdomain" }
  }

  const { companyId, subdomain } = parsed.data

  // Verify ownership
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!membership || membership.role !== "COMPANY_ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  // Check availability (exclude current company)
  const existing = await prisma.company.findFirst({
    where: {
      OR: [{ slug: subdomain }, { subdomain }],
      NOT: { id: companyId },
    },
  })
  if (existing) {
    return { success: false, error: "This subdomain is already taken. Please choose another." }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { slug: subdomain, subdomain },
  })

  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check subdomain availability (used for real-time validation)
// ─────────────────────────────────────────────────────────────────────────────
export async function checkSubdomainAvailability(
  subdomain: string,
  excludeCompanyId?: string
): Promise<{ available: boolean }> {
  const existing = await prisma.company.findFirst({
    where: {
      OR: [{ slug: subdomain }, { subdomain }],
      ...(excludeCompanyId ? { NOT: { id: excludeCompanyId } } : {}),
    },
    select: { id: true },
  })
  return { available: !existing }
}

// ─────────────────────────────────────────────────────────────────────────────
// Get the current user's company (used in onboarding to resume progress)
// ─────────────────────────────────────────────────────────────────────────────
export async function getCurrentUserCompany() {
  const session = await auth()
  if (!session?.user) return null

  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: {
      company: {
        include: {
          branding: true,
          subscription: { include: { plan: true } },
        },
      },
    },
  })

  return membership?.company ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// Logo upload URL (used in branding step — actual S3 upload happens on client)
// ─────────────────────────────────────────────────────────────────────────────
export async function updateCompanyLogo(
  companyId: string,
  logoUrl: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  })
  if (!membership || membership.role !== "COMPANY_ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { logoUrl },
  })

  return { success: true }
}

async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  )
}
