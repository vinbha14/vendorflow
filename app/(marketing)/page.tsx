// app/(marketing)/page.tsx
import Link from "next/link"
import {
  ArrowRight, Zap, Building2, UserCheck, AlertTriangle,
  Brain, Globe2, ShieldCheck, BarChart3, Star, CheckCircle2,
  Users, TrendingUp, FileText, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ROUTES, APP_NAME } from "@/config/constants"
import { PLANS } from "@/config/plans"

export const metadata = {
  title: "VendorFlow — Enterprise Vendor Management Platform",
  description:
    "The AI-powered vendor management platform for companies that take hiring seriously. Branded portals, duplicate detection, CV summarization.",
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components defined inline for a self-contained homepage
// ─────────────────────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">{APP_NAME}</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: "Features", href: ROUTES.FEATURES },
            { label: "Pricing", href: ROUTES.PRICING },
            { label: "About", href: ROUTES.ABOUT },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth CTAs */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.SIGN_IN}>Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={ROUTES.SIGN_UP}>
              Get started free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-40" style={{ backgroundSize: "32px 32px" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      {/* Radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative max-w-5xl mx-auto text-center px-6">
        {/* Announcement badge */}
        <Link href="/blog/ai-duplicate-detection" className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary hover:bg-primary/10 transition-colors mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Introducing AI duplicate detection</span>
          <ArrowRight className="h-3 w-3" />
        </Link>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
          Vendor management
          <br />
          <span className="text-gradient">reimagined for AI</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          The enterprise-grade platform where companies onboard vendors, receive candidates, and hire faster — with branded portals, AI-powered CV summaries, and intelligent duplicate detection.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button size="xl" asChild className="w-full sm:w-auto">
            <Link href={ROUTES.SIGN_UP}>
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild className="w-full sm:w-auto">
            <Link href={ROUTES.DEMO}>Watch demo</Link>
          </Button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {[
            "✓ 14-day free trial",
            "✓ No credit card required",
            "✓ Setup in under 10 minutes",
            "✓ India & international support",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5">{item}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function DashboardPreview() {
  return (
    <section className="py-16 border-t border-b bg-secondary/30">
      <div className="container max-w-6xl mx-auto px-6">
        <div className="rounded-2xl border shadow-modal overflow-hidden bg-background">
          {/* Mock dashboard header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-sidebar">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-md bg-sidebar-accent px-3 py-1 text-xs text-sidebar-foreground/60 font-mono">
                <span>🔒</span>
                <span>techcorp-india.vendorflow.com/dashboard</span>
              </div>
            </div>
          </div>

          {/* Mock dashboard content */}
          <div className="flex min-h-[440px]">
            {/* Sidebar */}
            <div className="hidden md:flex w-52 flex-col border-r bg-sidebar px-3 py-4 gap-1">
              {[
                { icon: "□", label: "Overview", active: true },
                { icon: "□", label: "Vendors" },
                { icon: "□", label: "Candidates" },
                { icon: "□", label: "Duplicates", badge: "3" },
                { icon: "□", label: "Analytics" },
                { icon: "□", label: "Billing" },
                { icon: "□", label: "Settings" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs ${
                    item.active
                      ? "bg-primary/80 text-white"
                      : "text-sidebar-foreground/60"
                  }`}
                >
                  <span className="text-[10px]">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Main */}
            <div className="flex-1 p-6 space-y-5">
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Active Vendors", value: "8", sub: "of 50 on plan" },
                  { label: "Submissions", value: "47", sub: "12 under review" },
                  { label: "Shortlisted", value: "11", sub: "3 hired" },
                  { label: "Duplicates", value: "3", sub: "Need review", alert: true },
                ].map((kpi) => (
                  <div key={kpi.label} className={`rounded-lg border p-4 ${kpi.alert ? "border-amber-200 bg-amber-50" : "bg-card"}`}>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${kpi.alert ? "text-amber-700" : ""}`}>{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* Candidate list preview */}
              <div className="rounded-lg border">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <span className="text-sm font-semibold">Recent Submissions</span>
                  <span className="text-xs text-primary">View all →</span>
                </div>
                <div className="divide-y">
                  {[
                    { name: "Amit Kapoor", title: "Senior React Developer · 6 yrs", vendor: "TalentBridge India", status: "Under Review", fit: 82 },
                    { name: "Deepika Nair", title: "DevOps Engineer · 5 yrs", vendor: "TalentBridge India", status: "Shortlisted", fit: 91 },
                    { name: "Priyanka Rao", title: "Data Scientist · 7 yrs", vendor: "TalentBridge India", status: "Submitted", fit: 78 },
                  ].map((candidate) => (
                    <div key={candidate.name} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {candidate.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{candidate.name}</p>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            candidate.status === "Shortlisted" ? "bg-purple-100 text-purple-700" :
                            candidate.status === "Submitted" ? "bg-blue-100 text-blue-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>{candidate.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{candidate.title} · {candidate.vendor}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-bold ${candidate.fit >= 85 ? "text-green-600" : "text-amber-600"}`}>
                          {candidate.fit}
                          <span className="text-xs font-normal text-muted-foreground">/100</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">AI fit score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Your branded dashboard — each company gets a fully isolated workspace at their own subdomain.
        </p>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Globe2,
      title: "Branded company portals",
      description:
        "Every company gets a fully branded portal at their own subdomain. Vendors see your logo, colors, and company info — not a generic platform.",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      icon: Brain,
      title: "AI CV summarization",
      description:
        "Every submitted CV is automatically summarized by GPT-4o. Hiring managers get a 5-section executive summary, skill breakdown, and recommended next action.",
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      icon: AlertTriangle,
      title: "Intelligent duplicate detection",
      description:
        "Our 3-layer engine catches duplicate candidates submitted by different vendors — using exact match, fuzzy name matching, and semantic embedding similarity.",
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      icon: Building2,
      title: "Multi-tenant architecture",
      description:
        "Complete data isolation between companies. Subdomain routing, per-tenant branding, role-based access control. Enterprise-grade from day one.",
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      icon: UserCheck,
      title: "Vendor onboarding flows",
      description:
        "Invite vendors by email. They complete structured onboarding: KYC documents, tax info, service categories. Approval workflow with audit trail.",
      color: "text-teal-500",
      bg: "bg-teal-50",
    },
    {
      icon: BarChart3,
      title: "Vendor performance analytics",
      description:
        "Track each vendor's submission volume, shortlist rate, hire rate, and candidate quality over time. Reward your top partners with data.",
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
    {
      icon: ShieldCheck,
      title: "Compliance-ready",
      description:
        "GST/VAT fields for India and international. Document verification workflow. Audit logs on every action. Built for regulated enterprises.",
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      icon: FileText,
      title: "Structured candidate profiles",
      description:
        "Beyond the CV — capture skills, notice period, work authorization, expected salary, employment type, and domain expertise in structured fields.",
      color: "text-cyan-500",
      bg: "bg-cyan-50",
    },
  ]

  return (
    <section className="py-24" id="features">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Platform features</Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Everything your team needs
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for enterprise, accessible to everyone. VendorFlow handles the complexity
            so your team can focus on hiring.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 hover:shadow-card-hover transition-shadow group"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg} mb-4`}>
                  <Icon className={`h-5.5 w-5.5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function AiSection() {
  return (
    <section className="py-24 bg-sidebar overflow-hidden relative">
      <div className="absolute inset-0 bg-grid opacity-10" style={{ backgroundSize: "40px 40px" }} />
      <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative max-w-7xl mx-auto px-6">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">AI-powered</Badge>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Every CV, summarized in seconds
            </h2>
            <p className="text-sidebar-foreground/70 text-lg mb-8 leading-relaxed">
              When a vendor submits a candidate, our AI immediately generates a structured summary — so your hiring managers can make decisions in seconds, not hours.
            </p>

            <ul className="space-y-4">
              {[
                "5-section executive summary written for hiring managers",
                "Key skills and domain expertise breakdown",
                "Strengths and possible concerns highlighted",
                "Work authorization and notice period summarized",
                "AI-recommended next action (shortlist, screen, reject)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sidebar-foreground/80 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Summary Card Preview */}
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  AK
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Amit Kapoor</p>
                  <p className="text-xs text-sidebar-foreground/50">Senior React Developer · 6 yrs</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">82<span className="text-sm font-normal text-sidebar-foreground/50">/100</span></div>
                <p className="text-[10px] text-sidebar-foreground/50">AI fit score</p>
              </div>
            </div>

            <div className="border-t border-sidebar-border pt-4 space-y-3">
              {[
                {
                  label: "Summary",
                  content: "Senior React developer with 6 years at Infosys. Led team of 8 engineers across 3 major e-commerce platforms. IIT Bombay background. Strong TypeScript and AWS skills.",
                },
                {
                  label: "Key skills",
                  content: "React, TypeScript, Node.js, GraphQL, AWS. Advanced state management. Performance optimization expert.",
                },
                {
                  label: "Recommended action",
                  content: "Shortlist for technical screening. Fast-track if team lead role is in scope.",
                  highlight: true,
                },
              ].map((section) => (
                <div key={section.label}>
                  <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wide mb-1">
                    {section.label}
                  </p>
                  <p className={`text-xs leading-relaxed ${section.highlight ? "text-primary" : "text-sidebar-foreground/70"}`}>
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-sidebar-border pt-3">
              <Sparkles className="h-3 w-3 text-primary" />
              <p className="text-[10px] text-sidebar-foreground/40">Generated by GPT-4o · 2 seconds</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SocialProofSection() {
  const companies = [
    "TechCorp India", "GlobalHire Corp", "FinStack", "BuildRight",
    "TalentFirst", "ScaleUp HQ", "CoreSystems", "NexaTeam",
  ]

  const testimonials = [
    {
      quote: "VendorFlow replaced 3 spreadsheets, 2 email threads, and weekly status calls. Our vendor response time dropped from 5 days to same-day.",
      author: "Priya Sharma",
      role: "Head of Talent Acquisition",
      company: "TechCorp India",
      initials: "PS",
    },
    {
      quote: "The AI duplicate detection caught a candidate submitted by two vendors simultaneously. Saved us an awkward conversation and a potential dispute.",
      author: "Sarah Chen",
      role: "VP of People",
      company: "GlobalHire Corp",
      initials: "SC",
    },
    {
      quote: "Our hiring managers love the CV summaries. They spend 30 seconds on each profile instead of 10 minutes. Interview pipeline is 3x faster.",
      author: "Arjun Mehta",
      role: "Engineering Hiring Manager",
      company: "ScaleUp HQ",
      initials: "AM",
    },
  ]

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container max-w-7xl mx-auto px-6">
        {/* Company logos */}
        <div className="text-center mb-16">
          <p className="text-sm text-muted-foreground uppercase tracking-widest mb-8">
            Trusted by hiring teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {companies.map((company) => (
              <span key={company} className="text-muted-foreground/50 font-semibold text-sm">
                {company}
              </span>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.author} className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          {[
            { value: "500+", label: "Companies onboarded" },
            { value: "12,000+", label: "Vendors managed" },
            { value: "3.2M+", label: "Candidates processed" },
            { value: "99.9%", label: "Platform uptime" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingPreviewSection() {
  const plans = PLANS.filter((p) => p.id !== "enterprise")

  return (
    <section className="py-24" id="pricing">
      <div className="container max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Simple pricing</Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">Pay for what you need</h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Based on number of vendors. No per-seat fees. No hidden charges.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 relative ${
                plan.isFeatured
                  ? "border-primary shadow-brand bg-primary/5"
                  : "bg-card"
              }`}
            >
              {plan.badgeText && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white whitespace-nowrap">
                  {plan.badgeText}
                </span>
              )}
              <h3 className="font-semibold text-lg">{plan.displayName}</h3>
              <div className="my-3">
                <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Up to {plan.maxVendors} vendors
              </p>
              <ul className="space-y-2 mb-6">
                {plan.features.slice(0, 5).map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm">
                    <Check className={f.included ? "text-success" : "text-muted-foreground/30"} />
                    <span className={f.included ? "" : "text-muted-foreground/50"}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.isFeatured ? "default" : "outline"}
                asChild
              >
                <Link href={ROUTES.SIGN_UP}>{plan.ctaText}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href={ROUTES.PRICING} className="text-sm text-primary hover:underline">
            See full pricing comparison →
          </Link>
        </div>
      </div>
    </section>
  )
}

function Check({ className }: { className?: string }) {
  return <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${className}`} />
}

function CtaSection() {
  return (
    <section className="py-24 bg-sidebar relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10" style={{ backgroundSize: "32px 32px" }} />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />

      <div className="container relative max-w-3xl mx-auto text-center px-6">
        <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
          Ready to modernize your vendor management?
        </h2>
        <p className="text-xl text-sidebar-foreground/70 mb-10">
          Join 500+ companies that use VendorFlow to manage vendors, AI-screen candidates, and hire faster.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="xl" asChild className="w-full sm:w-auto">
            <Link href={ROUTES.SIGN_UP}>
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="xl" variant="brand-outline" asChild className="w-full sm:w-auto">
            <Link href={ROUTES.DEMO}>Book a demo</Link>
          </Button>
        </div>
        <p className="text-sm text-sidebar-foreground/40 mt-6">
          14-day free trial · No credit card required · Setup in under 10 minutes
        </p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-background py-12">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-foreground">VendorFlow</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Enterprise vendor management for companies that take hiring seriously. India and international.
            </p>
          </div>

          {/* Links */}
          {[
            {
              title: "Product",
              links: [
                { label: "Features", href: ROUTES.FEATURES },
                { label: "Pricing", href: ROUTES.PRICING },
                { label: "Security", href: "/security" },
                { label: "Changelog", href: "/changelog" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: ROUTES.ABOUT },
                { label: "Blog", href: "/blog" },
                { label: "Contact", href: ROUTES.CONTACT },
                { label: "Careers", href: "/careers" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Privacy Policy", href: ROUTES.PRIVACY },
                { label: "Terms of Service", href: ROUTES.TERMS },
                { label: "Cookie Policy", href: ROUTES.COOKIES },
                { label: "DPA", href: "/legal/dpa" },
              ],
            },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm text-foreground mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} VendorFlow. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              All systems operational
            </span>
            <span>·</span>
            <span>Made with ♥ for India and the world</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <HeroSection />
      <DashboardPreview />
      <FeaturesSection />
      <AiSection />
      <SocialProofSection />
      <PricingPreviewSection />
      <CtaSection />
      <Footer />
    </div>
  )
}
