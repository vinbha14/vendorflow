// app/(marketing)/contact/page.tsx
import Link from "next/link"
import { Zap, Mail, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/constants"

export const metadata = {
  title: "Contact — VendorFlow",
  description: "Get in touch with the VendorFlow team. Sales enquiries, support, and partnership requests.",
}

export default function ContactPage() {
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

      <section className="py-24">
        <div className="container max-w-5xl mx-auto px-6">
          <div className="grid gap-16 lg:grid-cols-2 items-start">
            <div>
              <h1 className="text-5xl font-bold tracking-tight mb-6">Get in touch</h1>
              <p className="text-xl text-muted-foreground leading-relaxed mb-10">
                Whether you want to see a demo, discuss enterprise pricing, or just have questions — we&apos;re here.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Email us</p>
                    <a href="mailto:hello@vendorflow.com" className="text-primary hover:underline">hello@vendorflow.com</a>
                    <p className="text-sm text-muted-foreground mt-1">We respond within 1 business day.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Book a demo</p>
                    <p className="text-sm text-muted-foreground">See VendorFlow in action with a 30-minute walkthrough tailored to your use case.</p>
                    <Button size="sm" className="mt-3" asChild>
                      <Link href={ROUTES.SIGN_UP}>Start free trial instead</Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t">
                <h3 className="font-semibold mb-4">Common questions</h3>
                <div className="space-y-4">
                  {[
                    { q: "Do you offer enterprise pricing?", a: "Yes. Contact us for custom pricing based on vendor volume, team size, and compliance requirements." },
                    { q: "Is there an India-specific plan?", a: "All plans work for India. We support INR compensation fields, GST/PAN collection, and DPDP 2023 compliance." },
                    { q: "Can I self-host VendorFlow?", a: "We offer cloud-hosted SaaS. Private cloud and on-premise deployments are available for enterprise customers." },
                  ].map(({ q, a }) => (
                    <div key={q}>
                      <p className="font-medium text-sm">{q}</p>
                      <p className="text-sm text-muted-foreground mt-1">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8">
              <h2 className="text-xl font-bold mb-6">Send us a message</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Name</label>
                  <input type="text" placeholder="Your full name" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Work email</label>
                  <input type="email" placeholder="you@company.com" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Company</label>
                  <input type="text" placeholder="Your company name" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">How can we help?</label>
                  <textarea rows={4} placeholder="Tell us what you're looking for..." className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                </div>
                <p className="text-xs text-muted-foreground">By submitting this form you agree to our <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>. We will only use your data to respond to your enquiry.</p>
                <Button className="w-full">
                  <a href="mailto:hello@vendorflow.com">Send message</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
