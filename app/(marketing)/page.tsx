// app/(marketing)/page.tsx
import Link from "next/link"
import {
  ArrowRight, Zap, Building2, UserCheck, AlertTriangle,
  Brain, Globe2, ShieldCheck, BarChart3, CheckCircle2,
  FileText, Sparkles, Lock, Server, Award, ChevronRight,
  Users, TrendingUp, Clock, Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ROUTES, APP_NAME } from "@/config/constants"
import { PLANS } from "@/config/plans"

export const metadata = {
  title: "VendorFlow — Enterprise Vendor Management Platform",
  description:
    "The AI-powered vendor management platform built for enterprise hiring teams. Branded portals, intelligent duplicate detection, and GPT-4o CV summaries. GDPR compliant.",
}

function NavBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">{APP_NAME}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: "Features", href: "/#features" },
            { label: "Pricing", href: ROUTES.PRICING },
            { label: "Security", href: "/#security" },
            { label: "Contact", href: "/#contact" },
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
      <div className="absolute inset-0 bg-grid opacity-40" style={{ backgroundSize: "32px 32px" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative max-w-5xl mx-auto text-center px-6">
        <Badge className="mb-8 bg-primary/10 text-primary border-primary/20 gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          AI-powered duplicate detection — now live
        </Badge>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
          Vendor management
          <br />
          <span className="text-gradient">built for enterprise</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Onboard vendors, receive structured candidate submissions, detect duplicates with AI, and make faster hiring decisions — all in one secure, multi-tenant platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href={ROUTES.SIGN_UP}>
              Start free 14-day trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/#contact">Request a demo</Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {[
            "14-day free trial",
            "No credit card required",
            "GDPR compliant",
            "SOC 2 ready",
            "India & international",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrustBar() {
  return (
    <section className="border-y bg-secondary/30 py-8">
      <div className="container max-w-7xl mx-auto px-6">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-6">
          Trusted by hiring teams across India and globally
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {["TechCorp India", "GlobalHire Corp", "FinStack", "BuildRight", "TalentFirst", "ScaleUp HQ", "CoreSystems", "NexaTeam"].map((company) => (
            <span key={company} className="text-muted-foreground/50 font-semibold text-sm">{company}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Globe2,
      title: "Branded vendor portals",
      description: "Every company gets a white-labelled portal at their own subdomain. Vendors see your brand, not ours. Company colours, logo, and messaging — fully customisable.",
      badge: "Multi-tenant",
    },
    {
      icon: Brain,
      title: "AI CV summarisation",
      description: "GPT-4o reads every submitted CV and produces a structured hiring-manager summary in under 10 seconds. Recommendation, fit score, risks, compensation — all structured.",
      badge: "GPT-4o",
    },
    {
      icon: AlertTriangle,
      title: "Duplicate detection engine",
      description: "A 10-signal hybrid engine catches the same candidate submitted by two vendors — using exact email match, fuzzy name similarity, and resume embedding cosine similarity.",
      badge: "AI-powered",
    },
    {
      icon: UserCheck,
      title: "Structured candidate pipeline",
      description: "Vendors submit candidates through a structured form. Your team reviews, shortlists, interviews, and hires — with status tracked end-to-end across every vendor.",
      badge: "Pipeline",
    },
    {
      icon: BarChart3,
      title: "Analytics & reporting",
      description: "Vendor performance leaderboards, funnel conversion rates, AI usage costs, and audit logs. Every data point you need to run a professional talent operation.",
      badge: "Insights",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise security",
      description: "Complete tenant isolation, role-based access control, full audit trail, GDPR compliance tools, and encryption at rest and in transit. Built for enterprise from day one.",
      badge: "GDPR",
    },
  ]

  return (
    <section className="py-24" id="features">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Platform capabilities</Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Everything your hiring team needs
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            One platform to replace your vendor spreadsheets, email threads, and manual CV reviews.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description, badge }) => (
            <div key={title} className="rounded-xl border bg-card p-6 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">{badge}</Badge>
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
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
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">AI-powered analysis</Badge>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Every CV summarised in seconds, not hours
            </h2>
            <p className="text-sidebar-foreground/70 text-lg mb-8 leading-relaxed">
              When a vendor submits a candidate, GPT-4o immediately generates a structured hiring manager summary — so your team spends 30 seconds on a profile, not 10 minutes.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "Executive summary written for hiring managers, not HR systems",
                "Key skills and domain expertise ranked by evidence depth",
                "Honest risk assessment — gaps, short tenures, salary mismatches",
                "Work authorisation, notice period, and compensation summarised",
                "Decisive recommendation: Shortlist, Review, Hold, or Reject",
                "0–100 fit score calibrated by role seniority and market context",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sidebar-foreground/80 text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild>
              <Link href={ROUTES.SIGN_UP}>
                Try AI summaries free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">AK</div>
                <div>
                  <p className="font-semibold text-white text-sm">Amit Kapoor</p>
                  <p className="text-xs text-sidebar-foreground/50">Senior React Developer · 6 yrs · Infosys</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">82<span className="text-sm font-normal text-sidebar-foreground/50">/100</span></div>
                <p className="text-[10px] text-sidebar-foreground/50">Fit score</p>
              </div>
            </div>
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-wide mb-0.5">AI Recommendation</p>
              <p className="text-xs text-green-300 font-medium">Shortlist — Schedule technical screen focused on system design</p>
            </div>
            <div className="border-t border-sidebar-border pt-4 space-y-3">
              {[
                { label: "Executive summary", content: "Senior React developer with 6 years at Infosys. Led team of 8 engineers across 3 major e-commerce platforms. IIT Bombay. Strong TypeScript and AWS." },
                { label: "Top skills", content: "React 18 · TypeScript · Node.js · GraphQL · AWS Lambda · PostgreSQL" },
                { label: "Risks & gaps", content: "No cloud certifications despite 3 years of AWS usage. Notice period is 90 days — longer than average." },
                { label: "Compensation", content: "Expecting ₹18–22L per annum — at market for this experience level." },
              ].map((section) => (
                <div key={section.label}>
                  <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wide mb-1">{section.label}</p>
                  <p className="text-xs leading-relaxed text-sidebar-foreground/70">{section.content}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-sidebar-border pt-3">
              <Sparkles className="h-3 w-3 text-primary" />
              <p className="text-[10px] text-sidebar-foreground/40">Generated by GPT-4o · 4.2 seconds</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SecuritySection() {
  return (
    <section className="py-24 border-t" id="security">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <Badge variant="secondary" className="mb-4">Security & compliance</Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              Enterprise security, without the complexity
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Built with security at every layer — from data isolation between tenants to GDPR-compliant data processing. Your hiring data stays yours.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Lock, title: "Data isolation", desc: "Complete tenant separation. One company never sees another's data." },
                { icon: ShieldCheck, title: "GDPR compliant", desc: "Data Processing Agreements, right to erasure, and consent management built in." },
                { icon: Server, title: "SOC 2 ready", desc: "Audit logs on every action. Infrastructure designed for enterprise audits." },
                { icon: Award, title: "DPDP 2023", desc: "India's Digital Personal Data Protection Act requirements fully addressed." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-sm">{title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/legal/dpa">Download DPA</Link>
              </Button>
              <Link href="/legal/privacy" className="text-sm text-primary hover:underline">
                Privacy Policy →
              </Link>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold mb-4">GDPR compliance checklist</h3>
            <ul className="space-y-3">
              {[
                "GDPR Article 28 — Data Processing Agreement available on request",
                "Right to erasure — candidate data deletion within 30 days of request",
                "Data minimisation — only necessary fields collected and processed",
                "Audit trail — every action logged with actor, timestamp, and IP",
                "Encryption at rest and in transit (TLS 1.3 minimum)",
                "Role-based access control — least privilege enforced by default",
                "EU and India region hosting available",
                "No third-party data selling — contractually guaranteed",
                "Lawful basis documented for all data processing activities",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function SocialProofSection() {
  const testimonials = [
    {
      quote: "VendorFlow replaced 3 spreadsheets, 2 email threads, and weekly status calls. Our vendor response time dropped from 5 days to same-day.",
      author: "Priya Sharma",
      role: "Head of Talent Acquisition",
      company: "TechCorp India",
      initials: "PS",
    },
    {
      quote: "The AI duplicate detection caught a candidate submitted by two vendors simultaneously. Saved us a difficult conversation and a potential billing dispute.",
      author: "Sarah Chen",
      role: "VP of People",
      company: "GlobalHire Corp",
      initials: "SC",
    },
    {
      quote: "Hiring managers love the CV summaries. They spend 30 seconds on each profile instead of 10 minutes. Our interview pipeline is 3× faster.",
      author: "Arjun Mehta",
      role: "Engineering Hiring Manager",
      company: "ScaleUp HQ",
      initials: "AM",
    },
  ]

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid gap-6 md:grid-cols-3 mb-16">
          {testimonials.map((t) => (
            <div key={t.author} className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="h-4 w-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{t.initials}</div>
                <div>
                  <p className="text-sm font-semibold">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "500+", label: "Companies onboarded" },
            { value: "12,000+", label: "Vendors managed" },
            { value: "3.2M+", label: "Candidates processed" },
            { value: "99.9%", label: "Platform uptime SLA" },
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
  const plans = PLANS.filter((p) => p.id !== "enterprise").slice(0, 3)
  return (
    <section className="py-24" id="pricing">
      <div className="container max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Transparent pricing</Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">Pay for vendors, not seats</h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            No per-user fees. No hidden charges. Pricing based on how many vendors you manage.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 relative ${
                plan.isFeatured ? "border-primary shadow-brand bg-primary/5" : "bg-card"
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
                Up to {plan.maxVendors} vendors · {plan.maxTeamMembers} team members
              </p>
              <ul className="space-y-2 mb-6">
                {plan.features.slice(0, 5).map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 shrink-0 ${
                        f.included ? "text-green-500" : "text-muted-foreground/30"
                      }`}
                    />
                    <span className={f.included ? "" : "text-muted-foreground/50"}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.isFeatured ? "default" : "outline"} asChild>
                <Link href={ROUTES.SIGN_UP}>{plan.ctaText}</Link>
              </Button>
            </div>
          ))}
        </div>
        <div className="text-center space-y-2">
          <Link
            href={ROUTES.PRICING}
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            See full pricing and feature comparison <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="text-xs text-muted-foreground block">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section className="py-24 border-t" id="contact">
      <div className="container max-w-3xl mx-auto px-6 text-center">
        <Badge variant="secondary" className="mb-4">Get in touch</Badge>
        <h2 className="text-4xl font-bold tracking-tight mb-4">Talk to our team</h2>
        <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
          We work with enterprise hiring teams to understand your workflow before you sign anything. No pressure, no sales scripts.
        </p>
        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          {[
            { icon: Users, title: "Book a demo", desc: "See the platform live with your own use cases." },
            { icon: FileText, title: "Request a DPA", desc: "Download our GDPR Data Processing Agreement." },
            { icon: Shield, title: "Security review", desc: "Request our security documentation and compliance pack." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-5 text-left">
              <Icon className="h-5 w-5 text-primary mb-3" />
              <p className="font-semibold text-sm mb-1">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href={ROUTES.SIGN_UP}>
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="mailto:sales@vendorflow.com">Email sales team</a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          We typically respond within 2 business hours.
        </p>
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section className="py-24 bg-sidebar relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10" style={{ backgroundSize: "32px 32px" }} />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
      <div className="container relative max-w-3xl mx-auto text-center px-6">
        <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
          Ready to modernise your vendor management?
        </h2>
        <p className="text-xl text-sidebar-foreground/70 mb-10">
          Join 500+ companies using VendorFlow to manage vendors, screen candidates with AI, and hire faster.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href={ROUTES.SIGN_UP}>
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10"
          >
            <a href="mailto:sales@vendorflow.com">Talk to sales</a>
          </Button>
        </div>
        <p className="text-sm text-sidebar-foreground/40 mt-6">
          14-day free trial · No credit card required · GDPR compliant · Cancel anytime
        </p>
      </div>
    </section>
  )
}

function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t bg-background py-12">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-foreground">VendorFlow</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-4">
              Enterprise vendor management for companies that take hiring seriously. India and international.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
              GDPR compliant · SOC 2 ready · DPDP 2023
            </div>
          </div>

          {[
            {
              title: "Product",
              links: [
                { label: "Features", href: "/#features" },
                { label: "Pricing", href: ROUTES.PRICING },
                { label: "Security", href: "/#security" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "Contact", href: "/#contact" },
                { label: "Email us", href: "mailto:hello@vendorflow.com" },
              ],
            },
            {
              title: "Legal",
              links: [
                { label: "Privacy Policy", href: "/legal/privacy" },
                { label: "Terms of Service", href: "/legal/terms" },
                { label: "Cookie Policy", href: "/legal/cookies" },
                { label: "Data Processing Agreement", href: "/legal/dpa" },
              ],
            },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm text-foreground mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
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
          <p>© {year} VendorFlow Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              All systems operational
            </span>
            <span>·</span>
            <Link href="/legal/cookies" className="hover:text-foreground transition-colors">
              Cookie preferences
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <HeroSection />
      <TrustBar />
      <FeaturesSection />
      <AiSection />
      <SecuritySection />
      <SocialProofSection />
      <PricingPreviewSection />
      <ContactSection />
      <CtaSection />
      <Footer />
    </div>
  )
}
