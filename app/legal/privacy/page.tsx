// app/legal/privacy/page.tsx
import Link from "next/link"
import { Zap } from "lucide-react"

export const metadata = {
  title: "Privacy Policy — VendorFlow",
  description: "VendorFlow Privacy Policy — how we collect, use, and protect your personal data in compliance with GDPR and DPDP 2023.",
}

function LegalNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand"><Zap className="h-4 w-4 text-white" /></div>
          <span className="font-bold text-lg">VendorFlow</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/legal/cookies" className="hover:text-foreground">Cookies</Link>
          <Link href="/legal/dpa" className="hover:text-foreground">DPA</Link>
        </nav>
      </div>
    </header>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <LegalNav />
      <div className="container max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: 1 January 2025 · Effective: 1 January 2025</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-bold mb-3">1. Who we are</h2>
            <p className="text-muted-foreground">VendorFlow Technologies Pvt. Ltd. (&ldquo;VendorFlow&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) operates the VendorFlow vendor management platform available at vendorflow.com and associated subdomains. We are the data controller for personal data collected through our platform.</p>
            <p className="text-muted-foreground mt-3">For data protection enquiries: <a href="mailto:privacy@vendorflow.com" className="text-primary hover:underline">privacy@vendorflow.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. What personal data we collect</h2>
            <p className="text-muted-foreground mb-3">We collect personal data in the following categories:</p>
            <div className="space-y-3">
              {[
                { title: "Account data", items: ["Name, email address, password (hashed, never stored in plain text)", "Profile image (optional)", "Company name and role"] },
                { title: "Candidate profile data", items: ["Full name, email, phone number", "Professional history, skills, education", "Expected compensation and availability", "CV / resume documents", "Work authorization status"] },
                { title: "Usage data", items: ["Log data (IP address, browser type, pages visited)", "Actions taken within the platform (audit logs)", "Session information"] },
                { title: "Payment data", items: ["Billing information is processed by Stripe. VendorFlow does not store card numbers or full payment details."] },
              ].map(({ title, items }) => (
                <div key={title} className="rounded-lg border bg-card p-4">
                  <p className="font-semibold text-sm mb-2">{title}</p>
                  <ul className="space-y-1">
                    {items.map((item) => <li key={item} className="text-muted-foreground text-xs flex gap-2"><span>·</span>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Legal basis for processing (GDPR)</h2>
            <p className="text-muted-foreground mb-3">We process personal data on the following legal bases under GDPR Article 6:</p>
            <div className="space-y-2">
              {[
                { basis: "Contract performance (Art. 6(1)(b))", desc: "To provide the VendorFlow service to registered users and companies." },
                { basis: "Legitimate interests (Art. 6(1)(f))", desc: "To improve the platform, prevent fraud, and maintain security. We balance these interests against your rights." },
                { basis: "Legal obligation (Art. 6(1)(c))", desc: "To comply with applicable laws including tax, employment, and financial regulations." },
                { basis: "Consent (Art. 6(1)(a))", desc: "For optional features such as marketing emails. You may withdraw consent at any time." },
              ].map(({ basis, desc }) => (
                <div key={basis} className="border-l-2 border-primary/30 pl-4">
                  <p className="font-medium text-sm">{basis}</p>
                  <p className="text-muted-foreground text-xs mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. How we use your data</h2>
            <ul className="space-y-2 text-muted-foreground">
              {[
                "Provide, operate, and improve the VendorFlow platform",
                "Generate AI-powered candidate summaries using GPT-4o (OpenAI)",
                "Detect duplicate candidate profiles using our scoring engine",
                "Send transactional emails (account verification, notifications, invoices)",
                "Maintain security, prevent fraud, and comply with legal obligations",
                "Provide customer support",
              ].map((item) => <li key={item} className="flex gap-2 text-sm"><span className="text-primary mt-0.5">·</span>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Data sharing and third parties</h2>
            <p className="text-muted-foreground mb-3">We share personal data with the following third-party processors under appropriate data processing agreements:</p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Processor</th>
                    <th className="text-left p-3 font-semibold">Purpose</th>
                    <th className="text-left p-3 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { name: "Supabase", purpose: "Database hosting", location: "EU / India" },
                    { name: "OpenAI", purpose: "AI CV summarization", location: "USA (SCCs applied)" },
                    { name: "Stripe", purpose: "Payment processing", location: "USA (SCCs applied)" },
                    { name: "Resend", purpose: "Transactional email", location: "USA (SCCs applied)" },
                    { name: "Cloudflare R2", purpose: "File storage", location: "EU / India" },
                    { name: "Vercel", purpose: "Application hosting", location: "USA (SCCs applied)" },
                  ].map(({ name, purpose, location }) => (
                    <tr key={name} className="text-muted-foreground">
                      <td className="p-3 font-medium text-foreground">{name}</td>
                      <td className="p-3">{purpose}</td>
                      <td className="p-3">{location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground text-xs mt-3">We do not sell, rent, or share personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Your rights (GDPR & DPDP 2023)</h2>
            <p className="text-muted-foreground mb-3">You have the following rights regarding your personal data:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { right: "Right of access", desc: "Request a copy of all personal data we hold about you." },
                { right: "Right to rectification", desc: "Correct inaccurate or incomplete personal data." },
                { right: "Right to erasure", desc: "Request deletion of your personal data ('right to be forgotten')." },
                { right: "Right to portability", desc: "Receive your data in a machine-readable format." },
                { right: "Right to object", desc: "Object to processing based on legitimate interests." },
                { right: "Right to restrict processing", desc: "Limit how we use your data in certain circumstances." },
              ].map(({ right, desc }) => (
                <div key={right} className="rounded-lg border bg-card p-3">
                  <p className="font-semibold text-sm">{right}</p>
                  <p className="text-muted-foreground text-xs mt-1">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-4 text-sm">To exercise any right, email <a href="mailto:privacy@vendorflow.com" className="text-primary hover:underline">privacy@vendorflow.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Data retention</h2>
            <p className="text-muted-foreground">We retain personal data for as long as necessary to provide the service and comply with legal obligations. Account data is deleted 90 days after account closure. Candidate profile data is deleted upon request or after 3 years of inactivity, whichever is earlier. Audit logs are retained for 7 years for legal compliance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Cookies</h2>
            <p className="text-muted-foreground">We use essential cookies to operate the platform (authentication sessions) and optional analytics cookies. See our <Link href="/legal/cookies" className="text-primary hover:underline">Cookie Policy</Link> for full details and your preference controls.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Children&apos;s privacy</h2>
            <p className="text-muted-foreground">VendorFlow is a business-to-business platform. We do not knowingly collect personal data from anyone under the age of 18. If you believe a minor has submitted data, contact us immediately at <a href="mailto:privacy@vendorflow.com" className="text-primary hover:underline">privacy@vendorflow.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Changes to this policy</h2>
            <p className="text-muted-foreground">We may update this Privacy Policy from time to time. We will notify registered users of material changes by email at least 30 days before they take effect. Your continued use of the platform after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">11. Contact & complaints</h2>
            <p className="text-muted-foreground">For privacy enquiries: <a href="mailto:privacy@vendorflow.com" className="text-primary hover:underline">privacy@vendorflow.com</a></p>
            <p className="text-muted-foreground mt-2">If you are in the EU/UK and believe we have violated your rights, you have the right to lodge a complaint with your local data protection authority.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
