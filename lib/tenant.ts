// lib/tenant.ts
// Tenant resolution utilities
// Used by server components and server actions to get the current tenant context

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { TENANT_HEADERS, type TenantCompany } from "@/types/tenant";

// =============================================================================
// Get tenant from request headers (set by middleware)
// =============================================================================
export async function getTenantFromHeaders(): Promise<{
  tenantId: string | null;
  tenantSlug: string | null;
  isMainPlatform: boolean;
}> {
  const headersList = await headers();
  const tenantId = headersList.get(TENANT_HEADERS.TENANT_ID);
  const tenantSlug = headersList.get(TENANT_HEADERS.TENANT_SLUG);
  const isTenant = headersList.get(TENANT_HEADERS.IS_TENANT) === "true";

  return {
    tenantId,
    tenantSlug,
    isMainPlatform: !isTenant,
  };
}

// =============================================================================
// Get full tenant company data from the database
// Uses the tenantId from headers — safe to call in any server component
// =============================================================================
export async function getTenantCompany(): Promise<TenantCompany | null> {
  const { tenantId } = await getTenantFromHeaders();
  if (!tenantId) return null;

  const company = await prisma.company.findUnique({
    where: { id: tenantId, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      subdomain: true,
      logoUrl: true,
      country: true,
      currency: true,
      timezone: true,
      status: true,
      branding: {
        select: {
          primaryColor: true,
          secondaryColor: true,
          accentColor: true,
          tagline: true,
          description: true,
          supportEmail: true,
        },
      },
    },
  });

  return company;
}

// =============================================================================
// Require a valid tenant (throws if not found)
// Use in routes that must be scoped to a company
// =============================================================================
export async function requireTenant(): Promise<TenantCompany> {
  const company = await getTenantCompany();
  if (!company) {
    throw new Error("TENANT_NOT_FOUND");
  }
  return company;
}

// =============================================================================
// Resolve tenant by slug (for portal pages that use URL param instead of subdomain)
// =============================================================================
export async function getTenantBySlug(slug: string): Promise<TenantCompany | null> {
  const company = await prisma.company.findFirst({
    where: {
      OR: [{ slug }, { subdomain: slug }],
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      subdomain: true,
      logoUrl: true,
      country: true,
      currency: true,
      timezone: true,
      status: true,
      branding: {
        select: {
          primaryColor: true,
          secondaryColor: true,
          accentColor: true,
          tagline: true,
          description: true,
          supportEmail: true,
        },
      },
    },
  });

  return company;
}

// =============================================================================
// Check if a subdomain is available
// =============================================================================
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const existing = await prisma.company.findFirst({
    where: {
      OR: [{ slug: subdomain }, { subdomain }],
    },
    select: { id: true },
  });
  return !existing;
}

// =============================================================================
// Validate that the current user has access to the current tenant
// Returns the company member record if authorized
// =============================================================================
export async function validateTenantAccess(userId: string, companyId: string) {
  const member = await prisma.companyMember.findUnique({
    where: {
      userId_companyId: { userId, companyId },
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  if (!member || !member.isActive) {
    return null;
  }

  if (member.company.status !== "ACTIVE") {
    return null;
  }

  return member;
}

// =============================================================================
// Get the CSS variables for tenant branding (used in layout injection)
// =============================================================================
export function getTenantBrandingCss(branding: {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
} | null): string {
  if (!branding) return "";

  const { primaryColor = "#4F46E5", secondaryColor = "#818CF8", accentColor = "#C7D2FE" } = branding;

  return `
    :root {
      --brand-primary: ${primaryColor};
      --brand-secondary: ${secondaryColor};
      --brand-accent: ${accentColor};
    }
  `;
}

// =============================================================================
// Build the subdomain URL for a company
// =============================================================================
export function buildTenantUrl(slug: string, path = ""): string {
  const domain = process.env["NEXT_PUBLIC_APP_DOMAIN"] ?? "localhost:3000";
  const protocol = domain.includes("localhost") ? "http" : "https";
  return `${protocol}://${slug}.${domain}${path}`;
}

// =============================================================================
// Build the main platform URL
// =============================================================================
export function buildPlatformUrl(path = ""): string {
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
  return `${appUrl}${path}`;
}
