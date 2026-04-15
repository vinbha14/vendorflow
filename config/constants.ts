// config/constants.ts
// Platform-wide constants and configuration values

// =============================================================================
// App
// =============================================================================
export const APP_NAME = "VendorFlow";
export const APP_TAGLINE = "Vendor management, reimagined";
export const APP_DESCRIPTION =
  "The enterprise-grade vendor management platform for companies that take hiring seriously. AI-powered, branded portals, multi-tenant.";
export const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
export const APP_DOMAIN = process.env["NEXT_PUBLIC_APP_DOMAIN"] ?? "localhost:3000";
export const SUPPORT_EMAIL = "support@vendorflow.com";
export const SALES_EMAIL = "sales@vendorflow.com";

// =============================================================================
// File Upload Limits
// =============================================================================
export const FILE_LIMITS = {
  CV_MAX_SIZE_MB: 10,
  CV_MAX_SIZE_BYTES: 10 * 1024 * 1024,
  LOGO_MAX_SIZE_MB: 5,
  LOGO_MAX_SIZE_BYTES: 5 * 1024 * 1024,
  DOCUMENT_MAX_SIZE_MB: 25,
  DOCUMENT_MAX_SIZE_BYTES: 25 * 1024 * 1024,
  ALLOWED_CV_TYPES: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "image/jpeg", "image/png"],
} as const;

// =============================================================================
// Pagination defaults
// =============================================================================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CANDIDATES_PAGE_SIZE: 15,
  VENDORS_PAGE_SIZE: 20,
  AUDIT_LOGS_PAGE_SIZE: 50,
} as const;

// =============================================================================
// Invitation expiry
// =============================================================================
export const INVITATION_EXPIRY_DAYS = 7;
export const PASSWORD_RESET_EXPIRY_HOURS = 24;
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 48;

// =============================================================================
// AI Configuration
// =============================================================================
export const AI_CONFIG = {
  SUMMARY_MODEL: process.env["OPENAI_SUMMARY_MODEL"] ?? "gpt-4o",
  EMBEDDING_MODEL: process.env["OPENAI_EMBEDDING_MODEL"] ?? "text-embedding-3-small",
  EMBEDDING_DIMENSIONS: 1536, // text-embedding-3-small dimensions
  // Duplicate detection thresholds
  DUPLICATE_THRESHOLD_POSSIBLE: 0.5,
  DUPLICATE_THRESHOLD_LIKELY: 0.7,
  DUPLICATE_THRESHOLD_HIGH: 0.9,
  // Name similarity threshold (Levenshtein distance)
  NAME_SIMILARITY_THRESHOLD: 3,
  // Cosine similarity threshold for semantic duplicate detection
  SEMANTIC_SIMILARITY_THRESHOLD: 0.85,
  // Max tokens for CV text sent to AI (controls cost)
  MAX_RESUME_TOKENS: 3000,
} as const;

// =============================================================================
// Status Labels — Human-readable UI labels for DB enums
// =============================================================================
export const VENDOR_STATUS_LABELS: Record<string, string> = {
  INVITED: "Invited",
  PENDING: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

export const VENDOR_STATUS_COLORS: Record<string, string> = {
  INVITED: "blue",
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  SUSPENDED: "orange",
};

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  OFFER_SENT: "Offer Sent",
  REJECTED: "Rejected",
  HIRED: "Hired",
  WITHDRAWN: "Withdrawn",
};

export const SUBMISSION_STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "blue",
  UNDER_REVIEW: "amber",
  SHORTLISTED: "purple",
  INTERVIEW: "indigo",
  OFFER_SENT: "teal",
  REJECTED: "red",
  HIRED: "green",
  WITHDRAWN: "gray",
};

export const DUPLICATE_SEVERITY_LABELS: Record<string, string> = {
  POSSIBLE: "Possible Duplicate",
  LIKELY: "Likely Duplicate",
  HIGH_CONFIDENCE: "High Confidence Duplicate",
};

export const DUPLICATE_SEVERITY_COLORS: Record<string, string> = {
  POSSIBLE: "amber",
  LIKELY: "orange",
  HIGH_CONFIDENCE: "red",
};

// =============================================================================
// Route Paths — centralized to avoid typos across the codebase
// =============================================================================
export const ROUTES = {
  // Public
  HOME: "/",
  FEATURES: "/features",
  PRICING: "/pricing",
  ABOUT: "/about",
  CONTACT: "/contact",
  DEMO: "/demo",
  FAQ: "/faq",
  PRIVACY: "/legal/privacy",
  TERMS: "/legal/terms",
  COOKIES: "/legal/cookies",

  // Auth
  SIGN_IN: "/auth/sign-in",
  SIGN_UP: "/auth/sign-up",
  VERIFY_EMAIL: "/auth/verify-email",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",

  // Onboarding
  ONBOARDING: "/onboarding",
  ONBOARDING_COMPANY: "/onboarding/company-details",
  ONBOARDING_BRANDING: "/onboarding/branding",
  ONBOARDING_SUBDOMAIN: "/onboarding/subdomain",
  ONBOARDING_PLAN: "/onboarding/plan",
  ONBOARDING_BILLING: "/onboarding/billing",

  // Dashboard (Company Admin / Hiring Manager)
  DASHBOARD: "/dashboard",
  DASHBOARD_VENDORS: "/dashboard/vendors",
  DASHBOARD_VENDORS_INVITE: "/dashboard/vendors/invite",
  DASHBOARD_CANDIDATES: "/dashboard/candidates",
  DASHBOARD_DUPLICATES: "/dashboard/duplicates",
  DASHBOARD_ANALYTICS: "/dashboard/analytics",
  DASHBOARD_BILLING: "/dashboard/billing",
  DASHBOARD_SETTINGS: "/dashboard/settings",
  DASHBOARD_SETTINGS_COMPANY: "/dashboard/settings/company",
  DASHBOARD_SETTINGS_BRANDING: "/dashboard/settings/branding",
  DASHBOARD_SETTINGS_TEAM: "/dashboard/settings/team",
  DASHBOARD_AUDIT_LOGS: "/dashboard/audit-logs",

  // Vendor Portal
  VENDOR: "/vendor",
  VENDOR_COMPANIES: "/vendor/companies",
  VENDOR_CANDIDATES: "/vendor/candidates",
  VENDOR_CANDIDATES_NEW: "/vendor/candidates/new",
  VENDOR_DOCUMENTS: "/vendor/documents",
  VENDOR_SETTINGS: "/vendor/settings",

  // Super Admin
  ADMIN: "/admin",
  ADMIN_COMPANIES: "/admin/companies",
  ADMIN_BILLING: "/admin/billing",
  ADMIN_VENDORS: "/admin/vendors",
  ADMIN_AI_USAGE: "/admin/ai-usage",
  ADMIN_DUPLICATES: "/admin/duplicates",
  ADMIN_AUDIT_LOGS: "/admin/audit-logs",
  ADMIN_JOBS: "/admin/jobs",
  ADMIN_SETTINGS: "/admin/settings",
} as const;

// =============================================================================
// Audit Log Action Constants
// =============================================================================
export const AUDIT_ACTIONS = {
  // Auth
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_REGISTERED: "USER_REGISTERED",
  USER_PASSWORD_CHANGED: "USER_PASSWORD_CHANGED",
  // Company
  COMPANY_CREATED: "COMPANY_CREATED",
  COMPANY_UPDATED: "COMPANY_UPDATED",
  COMPANY_SUSPENDED: "COMPANY_SUSPENDED",
  COMPANY_BRANDING_UPDATED: "COMPANY_BRANDING_UPDATED",
  // Team
  TEAM_MEMBER_INVITED: "TEAM_MEMBER_INVITED",
  TEAM_MEMBER_REMOVED: "TEAM_MEMBER_REMOVED",
  TEAM_MEMBER_ROLE_CHANGED: "TEAM_MEMBER_ROLE_CHANGED",
  // Vendor
  VENDOR_INVITED: "VENDOR_INVITED",
  VENDOR_APPROVED: "VENDOR_APPROVED",
  VENDOR_REJECTED: "VENDOR_REJECTED",
  VENDOR_SUSPENDED: "VENDOR_SUSPENDED",
  // Candidate
  CANDIDATE_SUBMITTED: "CANDIDATE_SUBMITTED",
  CANDIDATE_SHORTLISTED: "CANDIDATE_SHORTLISTED",
  CANDIDATE_REJECTED: "CANDIDATE_REJECTED",
  CANDIDATE_HIRED: "CANDIDATE_HIRED",
  CANDIDATE_STATUS_CHANGED: "CANDIDATE_STATUS_CHANGED",
  // AI
  AI_SUMMARY_GENERATED: "AI_SUMMARY_GENERATED",
  AI_DUPLICATE_DETECTED: "AI_DUPLICATE_DETECTED",
  DUPLICATE_REVIEWED: "DUPLICATE_REVIEWED",
  // Billing
  SUBSCRIPTION_CREATED: "SUBSCRIPTION_CREATED",
  SUBSCRIPTION_UPGRADED: "SUBSCRIPTION_UPGRADED",
  SUBSCRIPTION_DOWNGRADED: "SUBSCRIPTION_DOWNGRADED",
  SUBSCRIPTION_CANCELED: "SUBSCRIPTION_CANCELED",
  PAYMENT_SUCCEEDED: "PAYMENT_SUCCEEDED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  // Document
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_DELETED: "DOCUMENT_DELETED",
  // Admin
  TENANT_IMPERSONATED: "TENANT_IMPERSONATED",
  IMPERSONATION_ENDED: "IMPERSONATION_ENDED",
} as const;

// =============================================================================
// Notification Types
// =============================================================================
export const NOTIFICATION_TYPES = {
  VENDOR_INVITED: "VENDOR_INVITED",
  VENDOR_APPROVED: "VENDOR_APPROVED",
  VENDOR_REJECTED: "VENDOR_REJECTED",
  VENDOR_PENDING: "VENDOR_PENDING",
  SUBMISSION_RECEIVED: "SUBMISSION_RECEIVED",
  CANDIDATE_SHORTLISTED: "CANDIDATE_SHORTLISTED",
  CANDIDATE_REJECTED: "CANDIDATE_REJECTED",
  CANDIDATE_STATUS_CHANGED: "CANDIDATE_STATUS_CHANGED",
  DUPLICATE_DETECTED: "DUPLICATE_DETECTED",
  BILLING_TRIAL_ENDING: "BILLING_TRIAL_ENDING",
  BILLING_PAYMENT_FAILED: "BILLING_PAYMENT_FAILED",
  BILLING_PLAN_CHANGED: "BILLING_PLAN_CHANGED",
  VENDOR_LIMIT_WARNING: "VENDOR_LIMIT_WARNING",
  DOCUMENT_VERIFIED: "DOCUMENT_VERIFIED",
  TEAM_MEMBER_INVITED: "TEAM_MEMBER_INVITED",
} as const;

// =============================================================================
// Country list for registration forms
// =============================================================================
export const COUNTRIES = [
  { code: "IN", name: "India", currency: "INR", timezone: "Asia/Kolkata" },
  { code: "US", name: "United States", currency: "USD", timezone: "America/New_York" },
  { code: "GB", name: "United Kingdom", currency: "GBP", timezone: "Europe/London" },
  { code: "SG", name: "Singapore", currency: "SGD", timezone: "Asia/Singapore" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", timezone: "Asia/Dubai" },
  { code: "AU", name: "Australia", currency: "AUD", timezone: "Australia/Sydney" },
  { code: "CA", name: "Canada", currency: "CAD", timezone: "America/Toronto" },
  { code: "DE", name: "Germany", currency: "EUR", timezone: "Europe/Berlin" },
  { code: "NL", name: "Netherlands", currency: "EUR", timezone: "Europe/Amsterdam" },
  { code: "JP", name: "Japan", currency: "JPY", timezone: "Asia/Tokyo" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];
