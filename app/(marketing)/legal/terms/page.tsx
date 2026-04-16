// app/(marketing)/legal/terms/page.tsx
import Link from "next/link"
import { Zap, ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms of Service — VendorFlow",
  description: "VendorFlow Terms of Service. The legal agreement governing your use of the VendorFlow platform.",
}

export default function TermsPage() {
  const updated = "15 April 2026"
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-foreground">VendorFlow</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {updated}</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Agreement</h2>
            <p className="text-muted-foreground">
              By accessing or using the VendorFlow platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of a company or organisation, you represent that you have authority to bind that entity to these Terms.
            </p>
            <p className="text-muted-foreground mt-3">
              The Service is operated by VendorFlow Technologies Pvt. Ltd., a company registered in India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of service</h2>
            <p className="text-muted-foreground">
              VendorFlow is a multi-tenant SaaS platform that enables companies to manage vendor relationships, receive and review candidate submissions from staffing agencies, and use AI-powered tools to assist in hiring decisions. The Service is provided on a subscription basis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Account registration</h2>
            <p className="text-muted-foreground">
              You must provide accurate, complete, and current information when registering. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must notify us immediately of any unauthorised access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Acceptable use</h2>
            <p className="text-muted-foreground mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
              <li>Submit false, inaccurate, or misleading candidate information</li>
              <li>Attempt to access another organisation's data or circumvent tenant isolation</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
              <li>Use the Service to store or transmit malicious code</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Use the AI features to make fully automated hiring decisions without human review</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Subscriptions and billing</h2>
            <p className="text-muted-foreground">
              The Service is offered on subscription plans as described on our pricing page. Subscriptions renew automatically at the end of each billing period. You may cancel at any time; cancellation takes effect at the end of the current billing period. We do not offer refunds for partial periods.
            </p>
            <p className="text-muted-foreground mt-3">
              We reserve the right to change pricing with 30 days' written notice to existing subscribers. Payment is processed by Stripe in accordance with their terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data and privacy</h2>
            <p className="text-muted-foreground">
              Your use of the Service is also governed by our <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>. For enterprise customers, we offer a Data Processing Agreement (DPA) in compliance with GDPR Article 28, available at <Link href="/legal/dpa" className="text-primary hover:underline">vendorflow.com/legal/dpa</Link>.
            </p>
            <p className="text-muted-foreground mt-3">
              You retain ownership of all data you submit to the Service. You grant us a limited licence to process that data solely for the purposes of providing the Service to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. AI features</h2>
            <p className="text-muted-foreground">
              AI-generated CV summaries and duplicate detection scores are provided for informational purposes only. They do not constitute professional advice. Hiring decisions must involve human judgement. We do not guarantee the accuracy of AI outputs and are not liable for decisions made on the basis of AI recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Intellectual property</h2>
            <p className="text-muted-foreground">
              VendorFlow and its licensors own all intellectual property rights in the Service, including software, design, trademarks, and documentation. These Terms do not grant you any rights in our intellectual property except the limited right to use the Service as described herein.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitation of liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, VendorFlow shall not be liable for indirect, incidental, special, or consequential damages, including loss of profits, data, or business opportunities. Our total cumulative liability shall not exceed the fees paid by you in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
            <p className="text-muted-foreground">
              Either party may terminate the agreement at any time. We may suspend or terminate your account if you violate these Terms. Upon termination, your data will be retained for 90 days and then deleted, unless you request earlier deletion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Governing law</h2>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Bangalore, Karnataka, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms: <a href="mailto:legal@vendorflow.com" className="text-primary hover:underline">legal@vendorflow.com</a>
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container max-w-4xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} VendorFlow Technologies Pvt. Ltd.</span>
          <div className="flex gap-4">
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/legal/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            <Link href="/legal/dpa" className="hover:text-foreground transition-colors">DPA</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
