// app/(marketing)/about/page.tsx
import Link from "next/link"
import { ArrowRight, Zap, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/constants"

export const metadata = {
  title: "About — VendorFlow",
  description: "VendorFlow is built to modernize how enterprise companies manage vendors and screen candidates. Learn about our mission and approach.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand"><Zap className="h-4 w-4 text-white" /></div>
            <span className="font-bold text-lg">VendorFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href={ROUTES.SIGN_IN}>Sign in</Link></Button>
            <Button size="sm" asChild><Link href={ROUTES.SIGN_UP}>Get started</Link></Button>
          </div>
        </div>
      </header>

      <section className="py-24 border-b">
        <div className="container max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-bold tracking-tight mb-6">We built what we needed, then made it available to everyone</h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            VendorFlow started from a simple frustration: managing 30+ recruiting vendors across email threads, spreadsheets, and WhatsApp groups is a full-time job that adds no value to hiring.
          </p>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We built a structured platform so hiring teams could focus on decisions — not coordination. Then we added AI to make those decisions faster and more consistent.
          </p>
        </div>
      </section>

      <section className="py-24 border-b">
        <div className="container max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12">Our principles</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {[
              { title: "Honesty over hype", desc: "AI fit scores are hard to earn. Our system tells hiring managers the truth — including gaps and risks — not just what they want to hear." },
              { title: "Structure reduces friction", desc: "Unstructured candidate data wastes everyone's time. We collect the right fields upfront so reviews, comparisons, and decisions are faster." },
              { title: "Vendors are partners", desc: "Good vendor relationships are built on clear expectations and fast feedback. VendorFlow makes communication structured, not bureaucratic." },
              { title: "Privacy by design", desc: "Candidate data is sensitive. We collect the minimum necessary, give companies tools to honor deletion requests, and never sell data to third parties." },
            ].map(({ title, desc }) => (
              <div key={title} className="border-l-2 border-primary pl-6">
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 border-b bg-secondary/30">
        <div className="container max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">Built for India, designed for the world</h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            India has one of the world's most complex vendor-driven hiring ecosystems — hundreds of staffing agencies, layered subcontracting, and GST compliance requirements. VendorFlow was designed with this reality in mind.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            At the same time, the platform is built on global standards: GDPR compliance, SOC 2 ready infrastructure, multi-currency support, and international work authorization tracking.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            GDPR compliant · DPDP 2023 · SOC 2 ready · India & international
          </div>
        </div>
      </section>

      <section className="py-24 bg-sidebar text-center">
        <div className="container max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-4">Want to learn more?</h2>
          <p className="text-sidebar-foreground/70 mb-8">Talk to our team or start a free trial and explore the platform yourself.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={ROUTES.SIGN_UP}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
