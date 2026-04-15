// app/(marketing)/page.tsx
import Link from "next/link"
import {
  ArrowRight, Zap, Building2, UserCheck, AlertTriangle,
  Brain, Globe2, ShieldCheck, BarChart3, CheckCircle2,
  FileText, Sparkles, Lock, Server, Award, ChevronRight,
  Users, Clock, Shield, Star, Cpu, CheckCheck, Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ROUTES, APP_NAME } from "@/config/constants"
import { PLANS } from "@/config/plans"

export const metadata = {
  title: "VendorFlow — Enterprise Vendor & Candidate Management Platform",
  description: "The AI-powered vendor management platform trusted by enterprise hiring teams. Branded portals, intelligent duplicate detection, GPT-4o CV summaries. GDPR & DPDP 2023 compliant.",
}

function NavBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">{APP_NAME}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: "Features", href: "/#features" },
            { label: "How it works", href: "/#how-it-works" },
            { label: "Pricing", href: ROUTES.PRICING },
            { label: "Security", href: "/#security" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/60 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
            <Link href={ROUTES.SIGN_IN}>Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={ROUTES.SIGN_UP}>Get started free <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 md:pt-32 pb-0">
      <div className="absolute inset-0 bg-dot opacity-30" style={{ backgroundSize: "20px 20px" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/60 to-background" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="container relative max-w-6xl mx-auto px-6">
        <div className="flex justify-center mb-8">
          <Link href="/#features" className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary hover:bg-primary/10 transition-all">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            AI duplicate detection — now in production
            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-bold tracking-tight text-foreground leading-[1.08] mb-6">
            The vendor management platform<br />
            <span className="text-gradient">your hiring team has been waiting for</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Replace spreadsheets, email chains, and manual CV reviews. VendorFlow gives every company a branded vendor portal, AI-powered candidate screening, and intelligent duplicate detection — in one secure, auditable platform.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Button size="lg" asChild className="h-12 px-8 text-base w-full sm:w-auto">
            <Link href={ROUTES.SIGN_UP}>Start your free 14-day trial <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base w-full sm:w-auto">
            <a href="mailto:sales@vendorflow.com">Talk to our team</a>
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground mb-16">
          {[
            { icon: CheckCheck, text: "No credit card required" },
            { icon: Shield, text: "GDPR & DPDP 2023 compliant" },
            { icon: Clock, text: "Setup in under 10 minutes" },
            { icon: Users, text: "Trusted by 500+ companies" },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-green-500 shrink-0" />{text}
            </span>
          ))}
        </div>

        {/* Dashboard mockup */}
        <div className="relative mx-auto max-w-5xl">
          <div className="rounded-2xl border border-border/60 shadow-modal overflow-hidden bg-background">
            <div className="flex items-center gap-3 px-5 py-3 border-b bg-sidebar">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 bg-sidebar-accent rounded-md px-3 py-1 text-xs text-sidebar-foreground/50 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  techcorp-india.vendorflow.com/dashboard
                </div>
              </div>
            </div>
            <div className="flex h-[420px]">
              <div className="hidden md:flex w-52 flex-col border-r bg-sidebar px-3 py-4 gap-0.5 shrink-0">
                <div className="flex items-center gap-2.5 px-3 py-2 mb-3">
                  <div className="h-7 w-7 rounded-md gradient-brand flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">TechCorp India</span>
                </div>
                {[
                  { icon: BarChart3, label: "Overview", active: true },
                  { icon: Building2, label: "Vendors", badge: "8" },
                  { icon: UserCheck, label: "Candidates", badge: "47" },
                  { icon: AlertTriangle, label: "Duplicates", badge: "3", warn: true },
                  { icon: BarChart3, label: "Analytics" },
                  { icon: FileText, label: "Audit Logs" },
                ].map(({ icon: Icon, label, active, badge, warn }) => (
                  <div key={label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-default ${active ? "bg-primary text-white" : "text-sidebar-foreground/60"}`}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${warn ? "bg-red-500/20 text-red-400" : "bg-sidebar-accent text-sidebar-foreground/60"}`}>{badge}</span>}
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-hidden bg-background p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-sm font-semibold">Dashboard Overview</h2>
                    <p className="text-xs text-muted-foreground">April 2026 · Growth plan</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />All systems operational
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: "Active Vendors", value: "8", sub: "of 50 on plan" },
                    { label: "Submissions", value: "47", sub: "12 under review" },
                    { label: "Shortlisted", value: "11", sub: "3 hired" },
                    { label: "Duplicate Alerts", value: "3", sub: "2 high confidence", warn: true },
                  ].map(({ label, value, sub, warn }) => (
                    <div key={label} className="rounded-lg border bg-card p-3">
                      <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">{label}</p>
                      <p className={`text-2xl font-bold ${warn ? "text-red-500" : "text-foreground"}`}>{value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b">
                    <p className="text-xs font-semibold">Recent submissions</p>
                    <span className="text-[10px] text-primary">View all →</span>
                  </div>
                  <div className="divide-y">
                    {[
                      { name: "Amit Kapoor", role: "Senior React Developer", vendor: "TalentBridge", score: 82, status: "Shortlisted", color: "text-green-600 bg-green-50" },
                      { name: "Priya Nair", role: "DevOps Engineer", vendor: "CodeForce", score: 74, status: "Under Review", color: "text-amber-600 bg-amber-50" },
                      { name: "Rahul Verma", role: "Product Manager", vendor: "TalentBridge", score: 68, status: "Submitted", color: "text-blue-600 bg-blue-50" },
                    ].map(({ name, role, vendor, score, status, color }) => (
                      <div key={name} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{name}</p>
                          <p className="text-muted-foreground truncate">{role} · {vendor}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="font-bold">{score}<span className="text-muted-foreground font-normal">/100</span></p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}>{status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -left-4 top-24 hidden lg:flex items-center gap-2 rounded-xl border bg-background shadow-card px-3 py-2.5">
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-green-600" />
            </div>
            <div><p className="text-xs font-semibold">AI summary ready</p><p className="text-[10px] text-muted-foreground">Generated in 3.8s</p></div>
          </div>
          <div className="absolute -right-4 bottom-24 hidden lg:flex items-center gap-2 rounded-xl border bg-background shadow-card px-3 py-2.5">
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div><p className="text-xs font-semibold">Duplicate detected</p><p className="text-[10px] text-muted-foreground">97% confidence match</p></div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LogoBar() {
  return (
    <section className="py-14 border-t border-b bg-secondary/20">
      <div className="container max-w-6xl mx-auto px-6">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest font-medium mb-8">Trusted by talent teams at high-growth companies</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {["TechCorp India","GlobalHire Corp","FinStack Technologies","BuildRight","ScaleUp HQ","NexaTeam","CoreSystems","TalentFirst"].map(name => (
            <span key={name} className="text-sm font-semibold text-muted-foreground/40 tracking-tight">{name}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="py-24">
      <div className="container max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <Badge variant="secondary" className="mb-4">The problem</Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">Managing vendors by email is costing you more than you think</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">Most talent teams manage 10–50 staffing vendors through a patchwork of email threads, spreadsheets, and WhatsApp groups. Every candidate submission is unstructured. Duplicates go undetected. CVs pile up unread. Nothing is auditable.</p>
            <div className="space-y-3">
              {[
                { text: "Candidates submitted by two vendors simultaneously — causing billing disputes", icon: AlertTriangle },
                { text: "Hiring managers spending 10 minutes reading CVs that could be summarised in 10 seconds", icon: Clock },
                { text: "No visibility into which vendors perform — and which are wasting your time", icon: Eye },
                { text: "Zero audit trail when a hiring decision is challenged months later", icon: FileText },
              ].map(({ text, icon: Icon }) => (
                <div key={text} className="flex items-start gap-3 p-4 rounded-xl border bg-red-50/50 border-red-100">
                  <Icon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">The VendorFlow solution</Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-6 leading-tight">One platform that handles all of it — automatically</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">VendorFlow gives every company a structured, branded vendor portal. Vendors submit candidates in a defined format. AI summarises every CV. Duplicates are caught before they cause problems. Everything is auditable.</p>
            <div className="space-y-3">
              {[
                { text: "Every vendor gets a branded portal at your subdomain — your brand, not ours", icon: Globe2 },
                { text: "GPT-4o summarises every CV in under 10 seconds with a structured hiring recommendation", icon: Brain },
                { text: "10-signal duplicate detection catches same-candidate submissions across vendors", icon: Cpu },
                { text: "Full audit log on every action — who reviewed what, when, and what they decided", icon: Shield },
              ].map(({ text, icon: Icon }) => (
                <div key={text} className="flex items-start gap-3 p-4 rounded-xl border bg-primary/3 border-primary/10">
                  <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    { icon: Globe2, title: "Branded vendor portals", description: "Every company gets a white-labelled portal at their own subdomain. Vendors see your logo, your colours, your messaging. Fully customisable.", highlight: "Multi-tenant" },
    { icon: Brain, title: "AI CV summarisation", description: "GPT-4o reads every submitted CV and produces a structured hiring-manager briefing in under 10 seconds. Fit score, recommendation, risks — all structured.", highlight: "GPT-4o powered" },
    { icon: AlertTriangle, title: "Duplicate detection", description: "A 10-signal hybrid engine catches the same candidate submitted by multiple vendors — using exact match, fuzzy name similarity, and resume embedding similarity.", highlight: "97%+ accuracy" },
    { icon: UserCheck, title: "Structured candidate pipeline", description: "Vendors submit through a structured intake form. Your team reviews, shortlists, interviews, and hires — with every status tracked end-to-end across all vendors.", highlight: "Full visibility" },
    { icon: BarChart3, title: "Vendor analytics", description: "Track submission volume, shortlist rates, hire rates, and AI costs per vendor. Know exactly which vendors are worth your time and budget.", highlight: "Actionable data" },
    { icon: FileText, title: "Immutable audit logs", description: "Every action — who reviewed a profile, who approved a vendor, who changed a status — logged with actor, timestamp, IP, and role. Exportable for compliance.", highlight: "SOC 2 ready" },
    { icon: Building2, title: "Vendor onboarding", description: "Invite vendors via email. Collect registration documents, insurance, NDA, and tax certificates. Track document expiry and verification status automatically.", highlight: "Document lifecycle" },
    { icon: Users, title: "Role-based access control", description: "Company admins see everything. Hiring managers see assigned candidates. Vendors see only their own submissions. Enforced at every layer.", highlight: "Least privilege" },
    { icon: ShieldCheck, title: "GDPR & compliance tools", description: "Data Processing Agreements, right to erasure workflows, data minimisation by design — built for GDPR, UK GDPR, and India's DPDP 2023.", highlight: "Privacy by design" },
  ]
  return (
    <section className="py-24 bg-secondary/20 border-t" id="features">
      <div className="container max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Platform capabilities</Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">Built for the full vendor management lifecycle</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">From onboarding your first vendor to reviewing your 500th candidate — every workflow is covered.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description, highlight }) => (
            <div key={title} className="group rounded-xl border bg-card p-6 hover:border-primary/30 hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide bg-secondary px-2 py-1 rounded-md">{highlight}</span>
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

function HowItWorksSection() {
  return (
    <section className="py-24" id="how-it-works">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">How it works</Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">From setup to first hire in one day</h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">VendorFlow is designed to be operational within hours, not weeks.</p>
        </div>
        <div className="relative">
          <div className="absolute left-8 top-10 bottom-10 w-px bg-border hidden md:block" />
          <div className="space-y-10">
            {[
              { step: "01", title: "Create your company workspace", description: "Sign up, customise your branded portal with your logo and colours, and configure your vendor intake settings. Takes about 5 minutes.", time: "5 minutes" },
              { step: "02", title: "Invite your vendor agencies", description: "Send email invitations to your staffing vendors. They create accounts, complete their company profile, and upload compliance documents. You approve them.", time: "Same day" },
              { step: "03", title: "Vendors submit candidates", description: "Approved vendors submit candidates through your branded portal. CVs are uploaded. AI summaries are generated automatically within seconds of submission.", time: "Ongoing" },
              { step: "04", title: "Review AI-summarised profiles", description: "Your hiring managers receive structured briefings for every candidate. Duplicate alerts are raised automatically. Shortlist, interview, or reject — all in one place.", time: "30 sec / profile" },
              { step: "05", title: "Track, audit, and improve", description: "Analytics show which vendors perform. Audit logs capture every decision. Duplicate detection protects you from billing disputes. Everything is exportable.", time: "Always-on" },
            ].map(({ step, title, description, time }) => (
              <div key={step} className="flex gap-6 md:gap-10 items-start">
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary bg-background">
                    <span className="text-sm font-bold text-primary">{step}</span>
                  </div>
                </div>
                <div className="flex-1 pt-3 pb-2">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <span className="text-xs font-medium bg-secondary text-muted-foreground px-2.5 py-1 rounded-full">{time}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function AiSection() {
  return (
    <section className="py-24 bg-sidebar overflow-hidden relative">
      <div className="absolute inset-0 bg-dot opacity-5" style={{ backgroundSize: "20px 20px" }} />
      <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="container relative max-w-7xl mx-auto px-6">
        <div className="grid gap-16 lg:grid-cols-2 items-center">
          <div>
            <Badge className="mb-5 bg-primary/20 text-primary border-primary/30">AI-powered screening</Badge>
            <h2 className="text-4xl font-bold text-white mb-5 leading-tight">Every CV summarised in 10 seconds. Every time.</h2>
            <p className="text-sidebar-foreground/70 text-lg mb-8 leading-relaxed">When a vendor submits a candidate, GPT-4o immediately generates a structured hiring manager briefing — so your team makes faster, better-informed decisions without spending 10 minutes on a PDF.</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { title: "Executive summary", desc: "Written for a hiring manager, not an ATS" },
                { title: "Ranked skill evidence", desc: "Claims validated against actual CV content" },
                { title: "Risk & gap assessment", desc: "Short tenures, employment gaps, mismatches" },
                { title: "Fit score 0–100", desc: "Calibrated by role seniority and market" },
                { title: "Structured recommendation", desc: "Shortlist, Review, Hold, or Reject" },
                { title: "Compensation summary", desc: "Notice period, expectations, currency" },
              ].map(({ title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="text-xs text-sidebar-foreground/50">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-sidebar-accent border border-sidebar-border mb-6">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-sidebar-foreground/70"><strong className="text-white">No automated decisions.</strong> All AI recommendations are advisory. A human hiring manager reviews every profile — GDPR Article 22 compliant.</p>
            </div>
            <Button asChild><Link href={ROUTES.SIGN_UP}>Try AI summaries free <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">AK</div>
                <div>
                  <p className="font-semibold text-white">Amit Kapoor</p>
                  <p className="text-xs text-sidebar-foreground/50">Senior React Developer · 6 yrs · Bangalore</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">82</div>
                <p className="text-[10px] text-sidebar-foreground/50">Fit score</p>
              </div>
            </div>
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-green-400" />
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-wide">AI Recommendation — Shortlist</p>
              </div>
              <p className="text-xs text-green-300 leading-relaxed">Strong React specialist with IIT Bombay background. Schedule a 45-minute technical screen focused on system design and TypeScript depth.</p>
            </div>
            <div className="space-y-4 border-t border-sidebar-border pt-4">
              {[
                { label: "Executive summary", content: "Senior React developer with 6 years at Infosys and Wipro. Led a team of 8 engineers across 3 major e-commerce platforms serving 50M+ users. IIT Bombay CS. Strong TypeScript, AWS Lambda, and PostgreSQL." },
                { label: "Top skills", content: "React 18 · TypeScript · Node.js · GraphQL · AWS Lambda · PostgreSQL · Redis" },
                { label: "Risks & considerations", content: "No cloud certifications despite 3 years of AWS usage. 90-day notice period — longer than average. Salary at top of market range." },
                { label: "Compensation", content: "Expecting ₹18–22L per annum. At market for this experience level and location." },
              ].map(({ label, content }) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-xs text-sidebar-foreground/70 leading-relaxed">{content}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-sidebar-border pt-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-primary/60" />
                <p className="text-[10px] text-sidebar-foreground/40">Generated by GPT-4o · 3.8 seconds · Vendor: TalentBridge</p>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">Human review required</span>
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
      <div className="container max-w-6xl mx-auto px-6">
        <div className="grid gap-16 lg:grid-cols-2 items-start">
          <div>
            <Badge variant="secondary" className="mb-4">Security & compliance</Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-5 leading-tight">Built for organisations where data protection is non-negotiable</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">Candidate data is sensitive personal data. We treat it that way — with complete tenant isolation, encryption at every layer, and compliance tools that make your legal team comfortable.</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: Lock, title: "Complete data isolation", desc: "Zero data leakage between tenants. Enforced at the database, API, and application layer." },
                { icon: ShieldCheck, title: "GDPR & DPDP compliant", desc: "DPAs, right to erasure, data minimisation, and consent management — built in, not bolted on." },
                { icon: Server, title: "SOC 2 Type II ready", desc: "Comprehensive audit logs on every user action. Infrastructure designed for enterprise compliance." },
                { icon: Award, title: "India DPDP 2023", desc: "Data localisation options, consent notices, and grievance officer support for Indian enterprises." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border bg-card p-5">
                  <Icon className="h-5 w-5 text-primary mb-3" />
                  <p className="font-semibold text-sm mb-1.5">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" asChild><Link href="/legal/dpa">Request DPA</Link></Button>
              <Button variant="outline" size="sm" asChild><Link href="/legal/privacy">Privacy Policy</Link></Button>
              <a href="mailto:security@vendorflow.com" className="text-sm text-primary hover:underline">Security review →</a>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-5 flex items-center gap-2">
                <CheckCheck className="h-4 w-4 text-green-500" />Security & compliance checklist
              </h3>
              <ul className="space-y-3">
                {[
                  "GDPR Article 28 — Data Processing Agreement available",
                  "GDPR Article 22 — No fully automated hiring decisions",
                  "Right to erasure — data deleted within 30 days of request",
                  "Data minimisation — only necessary fields collected",
                  "Audit trail — every action logged with actor, IP, and timestamp",
                  "Encryption in transit — TLS 1.3 minimum on all connections",
                  "Encryption at rest — AES-256 on all stored data",
                  "Password security — bcrypt with cost factor 12",
                  "Role-based access — least privilege enforced by default",
                  "EU and India region hosting available on request",
                  "No third-party data selling — contractually guaranteed",
                  "Sub-processor list maintained and available on request",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-amber-50 border-amber-200 p-5">
              <p className="text-sm font-semibold text-amber-800 mb-1">72-hour breach notification commitment</p>
              <p className="text-xs text-amber-700 leading-relaxed">In the unlikely event of a data breach affecting your data, we will notify you within 72 hours as required by GDPR Article 33. We maintain and regularly test an incident response plan.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="py-24 bg-secondary/20 border-t">
      <div className="container max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <Badge variant="secondary" className="mb-4">Customer stories</Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">Hiring teams that made the switch</h2>
          <p className="text-xl text-muted-foreground">Real results from real customers.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 mb-16">
          {[
            { quote: "VendorFlow replaced 3 spreadsheets, 2 email threads, and our Friday status calls. Vendor response time dropped from 5 days to same-day. I can't imagine going back.", author: "Priya Sharma", role: "Head of Talent Acquisition", company: "TechCorp India", initials: "PS", metric: "5 days → same-day", metricLabel: "vendor response time" },
            { quote: "The AI duplicate detection paid for itself in month one. It caught a candidate submitted by two vendors simultaneously — saved us a billing dispute and a very awkward conversation.", author: "Sarah Chen", role: "VP of People", company: "GlobalHire Corp", initials: "SC", metric: "₹2.4L", metricLabel: "billing dispute avoided, month 1" },
            { quote: "Our hiring managers now spend 30 seconds on a candidate profile instead of 10 minutes. The AI summaries are genuinely impressive — better than most human screenings I've seen.", author: "Arjun Mehta", role: "Engineering Hiring Manager", company: "ScaleUp HQ", initials: "AM", metric: "20×", metricLabel: "faster candidate review" },
          ].map(({ quote, author, role, company, initials, metric, metricLabel }) => (
            <div key={author} className="rounded-xl border bg-card p-6 flex flex-col">
              <div className="flex gap-0.5 mb-4">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">&ldquo;{quote}&rdquo;</p>
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{initials}</div>
                  <div>
                    <p className="text-sm font-semibold">{author}</p>
                    <p className="text-xs text-muted-foreground">{role} · {company}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/60 px-3 py-2">
                  <p className="text-lg font-bold">{metric}</p>
                  <p className="text-xs text-muted-foreground">{metricLabel}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t">
          {[
            { value: "500+", label: "Companies onboarded", sub: "across India and globally" },
            { value: "12,000+", label: "Vendors managed", sub: "on the platform" },
            { value: "3.2M+", label: "Candidates processed", sub: "through AI screening" },
            { value: "99.9%", label: "Platform uptime", sub: "in the last 12 months" },
          ].map(({ value, label, sub }) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-bold mb-1">{value}</p>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingPreviewSection() {
  const plans = PLANS.filter(p => p.monthlyPrice > 0).slice(0, 3)
  return (
    <section className="py-24" id="pricing">
      <div className="container max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Simple, transparent pricing</Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">Pay for vendors, not seats</h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">No per-user pricing. No hidden fees. One flat monthly fee based on how many vendors you manage.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3 mb-10">
          {plans.map(plan => (
            <div key={plan.id} className={`rounded-xl border p-6 relative flex flex-col ${plan.isFeatured ? "border-primary ring-1 ring-primary/20 bg-primary/3" : "bg-card"}`}>
              {plan.badgeText && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white whitespace-nowrap">{plan.badgeText}</span>}
              <div className="mb-5">
                <h3 className="font-bold text-lg mb-1">{plan.displayName}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.tagline}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">or ${plan.annualMonthlyEquivalent}/mo billed annually · Save 20%</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.slice(0, 7).map(f => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${f.included ? "text-green-500" : "text-muted-foreground/25"}`} />
                    <span className={f.included ? "" : "text-muted-foreground/40 line-through"}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.isFeatured ? "default" : "outline"} asChild>
                <Link href={ROUTES.SIGN_UP}>{plan.ctaText}</Link>
              </Button>
            </div>
          ))}
        </div>
        <div className="text-center space-y-3">
          <Link href={ROUTES.PRICING} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
            See full pricing, feature comparison, and Enterprise plan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="text-xs text-muted-foreground block">14-day free trial on all plans · No credit card required · Cancel anytime · GDPR compliant</p>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section className="py-24 bg-secondary/20 border-t">
      <div className="container max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">Frequently asked questions</h2>
          <p className="text-muted-foreground">Everything you need to know before signing up.</p>
        </div>
        <div className="space-y-4">
          {[
            { q: "How is VendorFlow different from an ATS?", a: "An ATS manages your internal job postings and applicants. VendorFlow manages your vendor relationships — the staffing agencies who send you candidates. VendorFlow sits upstream of your ATS, handling vendor onboarding, structured candidate intake, AI screening, and duplicate detection. Many customers use both." },
            { q: "Is candidate data ever shared between companies?", a: "Never. VendorFlow is a multi-tenant platform with complete data isolation. Your candidates, vendors, and all data are only visible to your organisation. Zero data leakage between tenants is enforced at the database, API, and application layer — not just at the UI layer." },
            { q: "What happens to our data if we cancel?", a: "Your data remains accessible for 90 days after cancellation so you can export everything. After 90 days, all data is permanently deleted from our systems — including backups. We can process this sooner on request for GDPR erasure purposes." },
            { q: "Is a GDPR Data Processing Agreement available?", a: "Yes. Our standard DPA is available at vendorflow.com/legal/dpa. Enterprise customers can request a countersigned copy within 2 business days. The DPA covers GDPR Article 28 requirements including sub-processors, security measures, breach notification (72 hours), and data subject rights assistance." },
            { q: "How accurate is the AI duplicate detection?", a: "Our 10-signal hybrid engine achieves 97%+ detection accuracy in production. It combines exact email and phone matching, fuzzy name similarity, LinkedIn URL matching, and resume embedding cosine similarity using OpenAI's text-embedding-3-small model. You review every flagged case — no automatic merges." },
            { q: "Can vendors see each other's submissions?", a: "No. Each vendor sees only the candidates they have submitted. Vendors cannot see other vendors, other vendor submissions, or any internal hiring manager notes, scores, or decisions. Role-based access control is enforced at every layer of the application." },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border bg-card p-6">
              <p className="font-semibold text-sm mb-2">{q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section className="py-28 bg-sidebar relative overflow-hidden">
      <div className="absolute inset-0 bg-dot opacity-5" style={{ backgroundSize: "20px 20px" }} />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent pointer-events-none" />
      <div className="container relative max-w-3xl mx-auto text-center px-6">
        <h2 className="text-5xl font-bold text-white mb-5 leading-tight">Ready to take control of your vendor ecosystem?</h2>
        <p className="text-xl text-sidebar-foreground/70 mb-10 leading-relaxed">Join 500+ companies using VendorFlow to manage vendors professionally, screen candidates with AI, and eliminate duplicate billing disputes.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Button size="lg" asChild className="h-12 px-8 text-base w-full sm:w-auto">
            <Link href={ROUTES.SIGN_UP}>Start your free 14-day trial <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base w-full sm:w-auto border-white/20 text-white hover:bg-white/10">
            <a href="mailto:sales@vendorflow.com">Talk to our team</a>
          </Button>
        </div>
        <p className="text-sm text-sidebar-foreground/40">No credit card required · 14-day free trial · GDPR compliant · Cancel anytime</p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-background py-14">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid gap-10 md:grid-cols-5 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-foreground">VendorFlow</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">Enterprise vendor management for companies that take hiring seriously. Trusted across India and globally.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />GDPR compliant · DPDP 2023 aligned</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Server className="h-3.5 w-3.5 text-blue-500 shrink-0" />SOC 2 Type II ready · Audit logs on every action</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5 text-purple-500 shrink-0" />TLS 1.3 · AES-256 at rest · bcrypt passwords</div>
            </div>
          </div>
          {[
            { title: "Product", links: [
              { label: "Features", href: "/#features" },
              { label: "How it works", href: "/#how-it-works" },
              { label: "Pricing", href: ROUTES.PRICING },
              { label: "Security", href: "/#security" },
              { label: "Sign in", href: ROUTES.SIGN_IN },
            ]},
            { title: "Company", links: [
              { label: "Contact us", href: "mailto:hello@vendorflow.com" },
              { label: "Sales enquiry", href: "mailto:sales@vendorflow.com" },
              { label: "Security team", href: "mailto:security@vendorflow.com" },
              { label: "Privacy team", href: "mailto:privacy@vendorflow.com" },
            ]},
            { title: "Legal", links: [
              { label: "Privacy Policy", href: "/legal/privacy" },
              { label: "Terms of Service", href: "/legal/terms" },
              { label: "Cookie Policy", href: "/legal/cookies" },
              { label: "Data Processing Agreement", href: "/legal/dpa" },
            ]},
          ].map(section => (
            <div key={section.title}>
              <h4 className="font-semibold text-sm text-foreground mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map(link => (
                  <li key={link.label}><Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} VendorFlow Technologies Pvt. Ltd. All rights reserved. Registered in India.</p>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />All systems operational</span>
            <Link href="/legal/cookies" className="hover:text-foreground transition-colors">Cookie preferences</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <HeroSection />
      <LogoBar />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AiSection />
      <SecuritySection />
      <TestimonialsSection />
      <PricingPreviewSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  )
}
