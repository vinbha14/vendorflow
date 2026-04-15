// config/plans.ts
// Single source of truth for all pricing plan definitions.
// These are the UI-facing definitions — the DB-stored plans are seeded from prisma/seed.ts.
// Keep these in sync.

export interface PlanFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

export interface Plan {
  id: string; // Matches the `name` column in the plans table
  displayName: string;
  tagline: string;
  monthlyPrice: number; // USD
  annualPrice: number; // USD (total annual cost)
  annualMonthlyEquivalent: number; // Annual / 12, for display
  currency: string;
  maxVendors: number; // -1 = unlimited
  maxTeamMembers: number; // -1 = unlimited
  features: PlanFeature[];
  isFeatured: boolean;
  badgeText?: string;
  ctaText: string;
  // Stripe Price IDs — populated from env at runtime
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    displayName: "Starter",
    tagline: "For small teams getting started",
    monthlyPrice: 49,
    annualPrice: 470,
    annualMonthlyEquivalent: 39,
    currency: "USD",
    maxVendors: 10,
    maxTeamMembers: 3,
    isFeatured: false,
    ctaText: "Start free trial",
    features: [
      { text: "Up to 10 vendors", included: true },
      { text: "3 team members", included: true },
      { text: "AI CV summarization", included: true },
      { text: "Duplicate detection", included: true },
      { text: "Branded company portal", included: true },
      { text: "Email notifications", included: true },
      { text: "Candidate pipeline management", included: true },
      { text: "API access", included: false },
      { text: "Audit logs", included: false },
      { text: "Priority support", included: false },
      { text: "SSO / SAML", included: false },
      { text: "Custom domain", included: false },
    ],
    stripePriceIdMonthly: process.env["STRIPE_STARTER_MONTHLY_PRICE_ID"],
    stripePriceIdAnnual: process.env["STRIPE_STARTER_ANNUAL_PRICE_ID"],
  },
  {
    id: "growth",
    displayName: "Growth",
    tagline: "For growing teams scaling vendor operations",
    monthlyPrice: 149,
    annualPrice: 1430,
    annualMonthlyEquivalent: 119,
    currency: "USD",
    maxVendors: 50,
    maxTeamMembers: 10,
    isFeatured: true,
    badgeText: "Most Popular",
    ctaText: "Start free trial",
    features: [
      { text: "Up to 50 vendors", included: true },
      { text: "10 team members", included: true },
      { text: "AI CV summarization", included: true },
      { text: "Duplicate detection", included: true },
      { text: "Branded company portal", included: true },
      { text: "Email notifications", included: true },
      { text: "Candidate pipeline management", included: true },
      { text: "API access", included: true },
      { text: "Audit logs", included: true, tooltip: "90-day audit log retention" },
      { text: "Priority support", included: false },
      { text: "SSO / SAML", included: false },
      { text: "Custom domain", included: false },
    ],
    stripePriceIdMonthly: process.env["STRIPE_GROWTH_MONTHLY_PRICE_ID"],
    stripePriceIdAnnual: process.env["STRIPE_GROWTH_ANNUAL_PRICE_ID"],
  },
  {
    id: "scale",
    displayName: "Scale",
    tagline: "For large teams with enterprise requirements",
    monthlyPrice: 349,
    annualPrice: 3350,
    annualMonthlyEquivalent: 279,
    currency: "USD",
    maxVendors: 200,
    maxTeamMembers: 50,
    isFeatured: false,
    ctaText: "Start free trial",
    features: [
      { text: "Up to 200 vendors", included: true },
      { text: "50 team members", included: true },
      { text: "AI CV summarization", included: true },
      { text: "Duplicate detection", included: true },
      { text: "Branded company portal", included: true },
      { text: "Email notifications", included: true },
      { text: "Candidate pipeline management", included: true },
      { text: "API access", included: true },
      { text: "Audit logs", included: true, tooltip: "1-year audit log retention" },
      { text: "Priority support", included: true },
      { text: "SSO / SAML", included: true },
      { text: "Custom domain", included: false },
    ],
    stripePriceIdMonthly: process.env["STRIPE_SCALE_MONTHLY_PRICE_ID"],
    stripePriceIdAnnual: process.env["STRIPE_SCALE_ANNUAL_PRICE_ID"],
  },
  {
    id: "enterprise",
    displayName: "Enterprise",
    tagline: "Custom solutions for large organizations",
    monthlyPrice: 0, // Displayed as "Custom"
    annualPrice: 0,
    annualMonthlyEquivalent: 0,
    currency: "USD",
    maxVendors: -1,
    maxTeamMembers: -1,
    isFeatured: false,
    ctaText: "Contact sales",
    features: [
      { text: "Unlimited vendors", included: true },
      { text: "Unlimited team members", included: true },
      { text: "AI CV summarization", included: true },
      { text: "Duplicate detection", included: true },
      { text: "Branded company portal", included: true },
      { text: "Email notifications", included: true },
      { text: "Candidate pipeline management", included: true },
      { text: "API access", included: true },
      { text: "Audit logs", included: true, tooltip: "Unlimited audit log retention" },
      { text: "Priority support", included: true, tooltip: "Dedicated customer success manager" },
      { text: "SSO / SAML", included: true },
      { text: "Custom domain", included: true },
    ],
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function getPlanLimits(planId: string) {
  const plan = getPlanById(planId);
  if (!plan) return { maxVendors: 0, maxTeamMembers: 0 };
  return {
    maxVendors: plan.maxVendors,
    maxTeamMembers: plan.maxTeamMembers,
  };
}

export function formatPlanPrice(plan: Plan, cycle: "monthly" | "annual"): string {
  if (plan.monthlyPrice === 0) return "Custom";
  const price = cycle === "annual" ? plan.annualMonthlyEquivalent : plan.monthlyPrice;
  return `$${price}`;
}

export const TRIAL_DAYS = 14;
export const GRACE_PERIOD_DAYS = 7;
export const ANNUAL_DISCOUNT_PERCENT = 20;
