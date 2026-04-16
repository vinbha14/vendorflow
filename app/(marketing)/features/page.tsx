// app/(marketing)/features/page.tsx
import Link from "next/link"
import { ArrowRight, Zap, Globe2, Brain, AlertTriangle, Building2, UserCheck, BarChart3, ShieldCheck, FileText, Lock, Server, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ROUTES } from "@/config/constants"

export const metadata = {
  title: "Features — VendorFlow",
  description: "Explore all VendorFlow features: branded portals, AI CV summarization, duplicate detection, vendor management, analytics, and enterprise security.",
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">VendorFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href={ROUTES.SIGN_IN}>Sign in</Link></Button>
            <Button size="sm" asChild><Link href={ROUTES.SIGN_UP}>Get started free</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 text-center border-b">
        <div className="container max-w-3xl mx-auto px-6">
          <Badge variant="secondary" className="mb-4">Platform features</Badge>
          <h1 className="text-5xl font-bold tracking-tight mb-6">Everything you need to manage vendors at scale</h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">From vendor onboarding to AI-powered candidate screening — VendorFlow covers every step of the vendor-to-hire workflow.</p>
          <Button asChild>
            <Link href={ROUTES.SIGN_UP}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Feature blocks */}
      <div className="container max-w-7xl mx-auto px-6 py-24 space-y-24">

        {/* Branded portals */}
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 mb-6"><Globe2 className="h-6 w-6 text-blue-500" /></div>
            <h2 className="text-3xl font-bold mb-4">Branded company portals</h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">Every company on VendorFlow gets a fully branded portal at their own subdomain — with your logo, colors, and company description. Vendors see your brand when they log in, not a generic platform.</p>
            <ul className="space-y-3">
              {["Custom subdomain (yourcompany.vendorflow.com)", "Upload your logo and set brand colors", "Custom tagline and company description", "Vendor-facing portal with your identity", "Instant setup — live in under 5 minutes"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-8">
            <div className="rounded-lg bg-secondary/50 p-4 text-center space-y-2">
              <div className="text-2xl font-bold text-primary">techcorp-india.vendorflow.com</div>
              <p className="text-sm text-muted-foreground">Your branded vendor portal — live immediately after setup</p>
            </div>
          </div>
        </div>

        {/* AI summaries */}
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <div className="order-2 lg:order-1 rounded-2xl border bg-card p-8 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">AI Summary — Amit Kapoor</p>
              <span className="text-2xl font-bold text-green-600">82<span className="text-sm font-normal text-muted-foreground">/100</span></span>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
              <p className="text-xs font-bold text-green-700 uppercase mb-0.5">Recommendation</p>
              <p className="text-sm text-green-700 font-medium">Shortlist — Schedule technical screen</p>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div><p className="font-semibold text-foreground text-xs uppercase tracking-wide mb-1">Summary</p><p>Senior React developer, 6 yrs at Infosys. Led team of 8 across 3 e-commerce platforms. IIT Bombay.</p></div>
              <div><p className="font-semibold text-foreground text-xs uppercase tracking-wide mb-1">Top skills</p><p>React 18 · TypeScript · Node.js · GraphQL · AWS</p></div>
              <div><p className="font-semibold text-foreground text-xs uppercase tracking-wide mb-1">Risks</p><p>No cloud certifications. 90-day notice period.</p></div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 mb-6"><Brain className="h-6 w-6 text-purple-500" /></div>
            <h2 className="text-3xl font-bold mb-4">AI CV summarization</h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">Every submitted CV is automatically analyzed by GPT-4o and converted into a structured hiring manager summary. Your team spends 30 seconds on a candidate, not 10 minutes.</p>
            <ul className="space-y-3">
              {["Executive summary written for hiring managers", "Skill depth ranked by evidence", "Honest risk assessment and gaps", "Compensation and availability summarized", "SHORTLIST / REVIEW / HOLD / REJECT decision", "0–100 fit score with calibration guidance"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Duplicate detection */}
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 mb-6"><AlertTriangle className="h-6 w-6 text-amber-500" /></div>
            <h2 className="text-3xl font-bold mb-4">Intelligent duplicate detection</h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">When two vendors submit the same candidate, our hybrid scoring engine catches it — before you've had two conversations, two screening calls, and a billing dispute.</p>
            <ul className="space-y-3">
              {["Email and phone exact match (Layer 1)", "Name fuzzy similarity with Levenshtein distance", "Company, experience, and skills overlap scoring", "Resume semantic similarity via text embeddings", "Review queue for hiring managers to confirm or dismiss", "Merge profiles — keep the best, reject the duplicate"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border-2 border-red-200 bg-red-50">
              <div>
                <p className="font-semibold text-sm text-red-900">Amit Kapoor ↔ Amit K.</p>
                <p className="text-xs text-red-700">Submitted by 2 different vendors</p>
              </div>
              <span className="text-xl font-bold text-red-600">94%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50">
              <div>
                <p className="font-semibold text-sm text-amber-900">Deepika Nair ↔ Deepika N.</p>
                <p className="text-xs text-amber-700">Similar name, skills, location</p>
              </div>
              <span className="text-xl font-bold text-amber-600">73%</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">AI-scored duplicate alerts with one-click review</p>
          </div>
        </div>

        {/* Security */}
        <div id="security" className="rounded-2xl border bg-secondary/30 p-12">
          <div className="text-center mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 mx-auto mb-6"><ShieldCheck className="h-6 w-6 text-indigo-500" /></div>
            <h2 className="text-3xl font-bold mb-4">Enterprise security & compliance</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Built for companies that operate in regulated environments. GDPR compliant out of the box, with the audit trail and data controls enterprise teams require.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Lock, title: "Complete data isolation", desc: "Multi-tenant architecture ensures one company's data never touches another's. Enforced at the database level." },
              { icon: ShieldCheck, title: "GDPR Article 28 DPA", desc: "Data Processing Agreement available. Right to erasure, data portability, and consent management built in." },
              { icon: Server, title: "Full audit trail", desc: "Every action — approval, rejection, login, data change — is logged with actor, timestamp, IP address, and role." },
              { icon: Building2, title: "Role-based access control", desc: "Company Admin, Hiring Manager, Vendor Admin — each role sees only what they need to see." },
              { icon: FileText, title: "DPDP 2023 ready", desc: "India's Digital Personal Data Protection Act requirements addressed. Indian data residency available." },
              { icon: UserCheck, title: "Encryption everywhere", desc: "TLS 1.3 in transit. Database encryption at rest. API keys and secrets never stored in plain text." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-card p-5">
                <Icon className="h-5 w-5 text-primary mb-3" />
                <p className="font-semibold text-sm mb-2">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button variant="outline" asChild><Link href="/legal/dpa">Download DPA</Link></Button>
            <Link href="/legal/privacy" className="text-sm text-primary hover:underline">Privacy Policy →</Link>
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="py-24 bg-sidebar text-center">
        <div className="container max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-sidebar-foreground/70 mb-8">14-day free trial. No credit card required. Setup in under 10 minutes.</p>
          <Button size="lg" asChild>
            <Link href={ROUTES.SIGN_UP}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
