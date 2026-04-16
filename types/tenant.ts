// types/tenant.ts
// Types for multi-tenant context — resolved from subdomain in middleware

import type { Company, CompanyBranding } from "@prisma/client";

// =============================================================================
// Tenant Resolution Result
// Resolved by middleware from the incoming request hostname
// =============================================================================
export interface TenantResolution {
  // Whether the request is on a tenant subdomain
  isTenantSubdomain: boolean;
  // The resolved company (null if on the main platform domain)
  company: TenantCompany | null;
  // The subdomain slug (e.g., "techcorp-india")
  slug: string | null;
  // Whether the company was found and is active
  isValid: boolean;
}

// Minimal company data needed for tenant context
export type TenantCompany = Pick<
  Company,
  | "id"
  | "name"
  | "slug"
  | "subdomain"
  | "logoUrl"
  | "country"
  | "currency"
  | "timezone"
  | "status"
> & {
  branding: Pick<
    CompanyBranding,
    "primaryColor" | "secondaryColor" | "accentColor" | "tagline" | "description" | "supportEmail"
  > | null;
};

// =============================================================================
// Request Context
// Injected into every server request by middleware headers
// =============================================================================
export interface RequestContext {
  // Tenant info (null if on main platform)
  tenantId: string | null;
  tenantSlug: string | null;
  companyName: string | null;
  companyLogoUrl: string | null;
  // Platform domain vs tenant subdomain
  isMainPlatform: boolean;
  isTenantPortal: boolean;
}

// Header keys used to pass context from middleware to server components
export const TENANT_HEADERS = {
  TENANT_ID: "x-tenant-id",
  TENANT_SLUG: "x-tenant-slug",
  COMPANY_NAME: "x-company-name",
  COMPANY_LOGO: "x-company-logo",
  IS_TENANT: "x-is-tenant",
} as const;

// =============================================================================
// Zod Schemas
// =============================================================================
import { z } from "zod";

export const subdomainSchema = z
  .string()
  .min(3, "Subdomain must be at least 3 characters")
  .max(50, "Subdomain must be at most 50 characters")
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
    "Subdomain can only contain lowercase letters, numbers, and hyphens. Must start and end with a letter or number."
  )
  .refine(
    (v) => !RESERVED_SUBDOMAINS.includes(v as typeof RESERVED_SUBDOMAINS[number]),
    "This subdomain is reserved. Please choose a different one."
  );

// Subdomains that cannot be used by companies
export const RESERVED_SUBDOMAINS = [
  "www",
  "app",
  "api",
  "admin",
  "mail",
  "email",
  "smtp",
  "pop",
  "imap",
  "ftp",
  "sftp",
  "support",
  "help",
  "docs",
  "blog",
  "status",
  "auth",
  "login",
  "signup",
  "register",
  "dashboard",
  "portal",
  "billing",
  "payments",
  "assets",
  "static",
  "cdn",
  "media",
  "uploads",
  "files",
  "webhooks",
  "events",
  "jobs",
  "queue",
  "cron",
  "test",
  "staging",
  "dev",
  "demo",
  "preview",
  "vendorflow",
  "platform",
] as const;
