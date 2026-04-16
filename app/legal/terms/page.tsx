// app/legal/terms/page.tsx
import Link from "next/link"
import { Zap } from "lucide-react"

export const metadata = {
  title: "Terms of Service — VendorFlow",
  description: "VendorFlow Terms of Service — the legal agreement governing your use of the platform.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand"><Zap className="h-4 w-4 text-white" /></div>
            <span className="font-bold text-lg">VendorFlow</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-foreground font-medium text-foreground">Terms</Link>
            <Link href="/legal/cookies" className="hover:text-foreground">Cookies</Link>
            <Link href="/legal/dpa" className="hover:text-foreground">DPA</Link>
          </nav>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: 1 January 2025 · Effective: 1 January 2025</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Agreement to terms</h2>
            <p className="text-muted-foreground">By accessing or using VendorFlow (&ldquo;the Service&rdquo;) operated by VendorFlow Technologies Pvt. Ltd. (&ldquo;Company&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users including company administrators, hiring managers, vendors, and any other users of the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Description of service</h2>
            <p className="text-muted-foreground">VendorFlow is a multi-tenant SaaS platform that enables companies to manage recruiting vendors, receive structured candidate submissions, detect duplicate profiles using AI, and generate AI-powered CV summaries. The Service is provided on a subscription basis.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Accounts and eligibility</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>You must be at least 18 years old and have legal authority to enter into contracts on behalf of your organization to use VendorFlow.</p>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized access.</p>
              <p>One person or legal entity may not maintain more than one free account.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Acceptable use</h2>
            <p className="text-muted-foreground mb-3">You agree not to use the Service to:</p>
            <ul className="space-y-2 text-muted-foreground">
              {[
                "Submit false, misleading, or fraudulent candidate information",
                "Violate any applicable law, regulation, or third-party rights",
                "Scrape, crawl, or extract data from the platform in an automated manner",
                "Attempt to gain unauthorized access to any part of the Service",
                "Transmit viruses, malware, or other harmful code",
                "Use the AI features to generate discriminatory hiring decisions in violation of applicable employment law",
                "Process candidate data in a manner inconsistent with GDPR, DPDP 2023, or other applicable data protection law",
              ].map((item) => (
                <li key={item} className="flex gap-2"><span className="text-destructive mt-0.5">×</span>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Subscription and payment</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Subscriptions are billed in advance on a monthly or annual basis. All prices are in USD unless otherwise stated. We reserve the right to change pricing with 30 days&apos; notice to existing subscribers.</p>
              <p>Your subscription will automatically renew unless you cancel before the renewal date. Refunds are not provided for partial periods except where required by law.</p>
              <p>If payment fails, we will notify you and provide a 7-day grace period before suspending your account. Data is retained for 90 days after account suspension.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Data and privacy</h2>
            <p className="text-muted-foreground">Your use of the Service is also governed by our <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>. For enterprise customers acting as data controllers of candidate data, a <Link href="/legal/dpa" className="text-primary hover:underline">Data Processing Agreement</Link> is available and required for GDPR compliance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. AI features and limitations</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>VendorFlow uses OpenAI&apos;s GPT-4o to generate candidate summaries and fit scores. These AI outputs are provided for informational purposes only and do not constitute professional HR, legal, or employment advice.</p>
              <p>AI-generated summaries and scores should be used as one input among many in hiring decisions. You retain full responsibility for all hiring decisions made using the platform. VendorFlow is not liable for hiring outcomes or employment disputes arising from the use of AI-generated content.</p>
              <p>We continuously work to reduce bias in AI outputs, but we do not warrant that AI-generated content is free from all bias or error.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Intellectual property</h2>
            <p className="text-muted-foreground">The Service, including its design, code, trademarks, and content created by VendorFlow, is owned by VendorFlow Technologies Pvt. Ltd. and protected by applicable intellectual property laws. You retain ownership of all data and content you submit to the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Confidentiality</h2>
            <p className="text-muted-foreground">Each party agrees to keep the other&apos;s confidential information confidential and not to disclose it to third parties without prior written consent. This obligation survives termination of your subscription for 3 years.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Service availability and SLA</h2>
            <p className="text-muted-foreground">We target 99.9% monthly uptime. Planned maintenance is communicated at least 24 hours in advance. We are not liable for downtime caused by factors outside our reasonable control, including third-party service outages, internet disruptions, or force majeure events.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">11. Limitation of liability</h2>
            <p className="text-muted-foreground">To the maximum extent permitted by law, VendorFlow&apos;s total liability to you for any claim arising out of or relating to these Terms or the Service will not exceed the amount you paid to VendorFlow in the 12 months preceding the claim. We are not liable for indirect, incidental, special, or consequential damages.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">12. Termination</h2>
            <p className="text-muted-foreground">You may cancel your subscription at any time from your billing settings. We may suspend or terminate your account immediately for material breach of these Terms. Upon termination, your access to the Service will cease and your data will be retained for 90 days before deletion, unless you request earlier deletion.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">13. Governing law</h2>
            <p className="text-muted-foreground">These Terms are governed by the laws of India. Disputes will be subject to the exclusive jurisdiction of the courts of Bangalore, Karnataka, India, except where mandatory consumer protection laws in your jurisdiction apply.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">14. Changes to terms</h2>
            <p className="text-muted-foreground">We may modify these Terms with 30 days&apos; notice for material changes. Continued use of the Service after the effective date constitutes acceptance. For changes required by law, the notice period may be shorter.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">15. Contact</h2>
            <p className="text-muted-foreground">For legal enquiries: <a href="mailto:legal@vendorflow.com" className="text-primary hover:underline">legal@vendorflow.com</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
