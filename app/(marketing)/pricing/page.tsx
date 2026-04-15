// app/(marketing)/pricing/page.tsx
import Link from "next/link"
import { Check, X, Zap, ArrowRight, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PLANS, ANNUAL_DISCOUNT_PERCENT, TRIAL_DAYS } from "@/config/plans"
import { ROUTES } from "@/config/constants"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing — VendorFlow",
  description:
    "Simple, vendor-count-based pricing. Start free for 14 days. No credit card required.",
}

const FAQ = [
  {
    q: "How does pricing work?",
    a: "VendorFlow charges based on the number of active vendors in your workspace — not per seat or per submission. An active vendor is one with an approved relationship with your company.",
  },
  {
    q: "What counts as an active vendor?",
    a: "A vendor whose status is 'Approved' in your workspace. Invited or pending vendors don't count toward your limit.",
  },
  {
    q: "Can I change my plan later?",
    a: "Yes. You can upgrade or downgrade at any time through the billing portal. Upgrades take effect immediately; downgrades apply at the end of your billing period.",
  },
  {
    q: "Is there a free trial?",
    a: `Yes — every plan starts with a ${TRIAL_DAYS}-day free trial. No credit card required to begin. You only need to add payment details when you're ready to continue after the trial.`,
  },
  {
    q: "Do you support India-based companies?",
    a: "Absolutely. VendorFlow is built with India and international companies in mind. We support INR billing, GST/PAN fields, India address formats, and IST timezone by default.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit and debit cards (Visa, Mastercard, American Express) via Stripe. For annual Enterprise plans, we also accept bank transfers.",
  },
  {
    q: "Can vendors use VendorFlow for free?",
    a: "Yes. Vendors always use VendorFlow for free. The platform charges the hiring company, not the vendors.",
  },
  {
    q: "What happens if I exceed my vendor limit?",
    a: "We'll alert you when you approach your limit. You'll have a 7-day grace period before new vendor approvals are blocked. You won't lose any data — just upgrade to continue.",
  },
]

// Full feature comparison data
const FEATURE_ROWS = [
  { category: "Vendors & team", isHeader: true },
  { label: "Active vendors", starter: "10", growth: "50", scale: "200", enterprise: "Unlimited" },
  { label: "Team members", starter: "3", growth: "10", scale: "50", enterprise: "Unlimited" },
  { label: "Vendor invitation flow", starter: true, growth: true, scale: true, enterprise: true },
  { label: "Branded company portal", starter: true, growth: true, scale: true, enterprise: true },

  { category: "AI features", isHeader: true },
  { label: "AI CV summarization", starter: true, growth: true, scale: true, enterprise: true },
  { label: "Duplicate detection (3-layer)", starter: true, growth: true, scale: true, enterprise: true },
  { label: "Human duplicate review workflow", starter: true, growth: true, scale: true, enterprise: true },
  { label: "Custom AI prompt tuning", starter: false, growth: false, scale: false, enterprise: true },

  { category: "Platform", isHeader: true },
  { label: "Candidate pipeline management", starter: true, growth: true, scale: true, enterprise: true },
  { label: "CV upload & storage", starter: true, growth: true, scale: true, enterprise: true },
  { label: "Vendor KYC documents", starter: true, growth: true, scale: true, enterprise: true },
  { label: "In-app notifications", starter: true, growth: true, scale: true, enterprise: true },
  { label: "Email notifications", starter: true, growth: true, scale: true, enterprise: true },
  { label: "API access", starter: false, growth: true, scale: true, enterprise: true },
  { label: "Audit logs", starter: false, growth: "90 days", scale: "1 year", enterprise: "Unlimited" },
  { label: "Custom subdomain", starter: true, growth: true, scale: true, enterprise: true },
  { label: "Custom domain (CNAME)", starter: false, growth: false, scale: false, enterprise: true },

  { category: "Security & compliance", isHeader: true },
  { label: "SSO / SAML", starter: false, growth: false, scale: true, enterprise: true },
  { label: "RBAC (role-based access)", starter: true, growth: true, scale: true, enterprise: true },
  { label: "Data export", starter: false, growth: true, scale: true, enterprise: true },
  { label: "Data processing agreement", starter: false, growth: false, scale: true, enterprise: true },

  { category: "Support", isHeader: true },
  { label: "Email support", starter: true, growth: true, scale: true, enterprise: true },
  { label: "Priority support", starter: false, growth: false, scale: true, enterprise: true },
  { label: "Dedicated success manager", starter: false, growth: false, scale: false, enterprise: true },
  { label: "Onboarding assistance", starter: false, growth: false, scale: true, enterprise: true },
  { label: "SLA", starter: false, growth: false, scale: "99.9%", enterprise: "99.99%" },
]

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-success mx-auto" />
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
  return <span className="text-sm font-medium">{value}</span>
}

export default function PricingPage() {
  const displayPlans = PLANS.filter((p) => p.id !== "enterprise")

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold">VendorFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href={ROUTES.SIGN_IN}>Sign in</Link></Button>
            <Button size="sm" asChild><Link href={ROUTES.SIGN_UP}>Start free trial</Link></Button>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Simple pricing</Badge>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Pay for vendors, not seats
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            One price based on how many vendors are in your workspace. No per-user fees, no submission limits, no surprises.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" />{TRIAL_DAYS}-day free trial</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" />No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" />Cancel anytime</span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-20">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.isFeatured
                  ? "border-primary shadow-brand ring-1 ring-primary/30 bg-primary/[0.02]"
                  : "bg-card"
              }`}
            >
              {plan.badgeText && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white whitespace-nowrap">
                  {plan.badgeText}
                </span>
              )}

              <div className="mb-5">
                <h3 className="font-bold text-lg">{plan.displayName}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
              </div>

              <div className="mb-5">
                {plan.monthlyPrice === 0 ? (
                  <div className="text-3xl font-bold">Custom</div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
                      <span className="text-muted-foreground text-sm">/mo</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      or ${plan.annualMonthlyEquivalent}/mo billed annually
                      <Badge variant="success" className="ml-2 text-[10px]">Save {ANNUAL_DISCOUNT_PERCENT}%</Badge>
                    </p>
                  </>
                )}
                <p className="text-sm font-medium text-muted-foreground mt-3">
                  {plan.maxVendors === -1 ? "Unlimited vendors" : `Up to ${plan.maxVendors} vendors`}
                </p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.filter((f) => f.included).slice(0, 7).map((f) => (
                  <li key={f.text} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.isFeatured ? "default" : plan.id === "enterprise" ? "outline" : "outline"}
                asChild
              >
                <Link href={plan.id === "enterprise" ? `mailto:sales@vendorflow.com` : ROUTES.SIGN_UP}>
                  {plan.ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Full comparison table */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">Full feature comparison</h2>
          <div className="rounded-2xl border overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-5 bg-secondary/50">
              <div className="p-4 font-semibold text-sm">Features</div>
              {["Starter", "Growth", "Scale", "Enterprise"].map((name) => (
                <div key={name} className="p-4 text-center font-semibold text-sm">{name}</div>
              ))}
            </div>

            {FEATURE_ROWS.map((row, i) => {
              if ("isHeader" in row) {
                return (
                  <div
                    key={row.category}
                    className="grid grid-cols-5 bg-muted/40 border-t"
                  >
                    <div className="p-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground col-span-5">
                      {row.category}
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={row.label}
                  className={`grid grid-cols-5 border-t ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                >
                  <div className="p-3 px-4 text-sm text-muted-foreground">{row.label}</div>
                  <div className="p-3 text-center"><CellValue value={row.starter} /></div>
                  <div className="p-3 text-center"><CellValue value={row.growth} /></div>
                  <div className="p-3 text-center"><CellValue value={row.scale} /></div>
                  <div className="p-3 text-center"><CellValue value={row.enterprise} /></div>
                </div>
              )
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="rounded-2xl border bg-sidebar text-white p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-10" style={{ backgroundSize: "32px 32px" }} />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-3">Need more than 200 vendors?</h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              Our Enterprise plan offers unlimited vendors, dedicated support, SSO, custom domain, and a tailored SLA. Let&apos;s talk.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                <a href="mailto:sales@vendorflow.com">
                  <MessageCircle className="h-4 w-4" />
                  Contact sales
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                <Link href={ROUTES.DEMO}>Book a demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
