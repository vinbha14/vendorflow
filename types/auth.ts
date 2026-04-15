// types/auth.ts
// Auth-related TypeScript types and Zod validation schemas

import { UserGlobalRole, CompanyMemberRole } from "@prisma/client";
import { z } from "zod";
import "next-auth";

// =============================================================================
// NextAuth Session Augmentation
// Adds custom fields (id, globalRole) to the default session.user object
// =============================================================================
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      globalRole: UserGlobalRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    globalRole?: UserGlobalRole;
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    globalRole: UserGlobalRole;
  }
}

// =============================================================================
// Zod Schemas — Auth
// =============================================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .transform((v) => v.toLowerCase().trim()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// =============================================================================
// TypeScript Types — Auth
// =============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// =============================================================================
// Auth Context Types
// =============================================================================

export type AuthUserRole = UserGlobalRole | CompanyMemberRole | "VENDOR_ADMIN" | "VENDOR_RECRUITER";

export interface AuthContext {
  userId: string;
  email: string;
  globalRole: UserGlobalRole;
  isSuperAdmin: boolean;
  // Set when operating within a company workspace
  tenantId?: string;
  companyRole?: CompanyMemberRole;
  // Set when operating as a vendor
  vendorId?: string;
  vendorRole?: "ADMIN" | "RECRUITER";
}

// =============================================================================
// Permission helpers
// =============================================================================

export function canManageVendors(role: CompanyMemberRole): boolean {
  return role === CompanyMemberRole.COMPANY_ADMIN;
}

export function canReviewCandidates(role: CompanyMemberRole): boolean {
  return (
    role === CompanyMemberRole.COMPANY_ADMIN ||
    role === CompanyMemberRole.HIRING_MANAGER
  );
}

export function canManageBilling(role: CompanyMemberRole): boolean {
  return role === CompanyMemberRole.COMPANY_ADMIN;
}

export function canManageTeam(role: CompanyMemberRole): boolean {
  return role === CompanyMemberRole.COMPANY_ADMIN;
}

export function canViewAuditLogs(role: CompanyMemberRole): boolean {
  return role === CompanyMemberRole.COMPANY_ADMIN;
}
