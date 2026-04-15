// app/(marketing)/legal/privacy/page.tsx
import Link from "next/link"
import { Zap, ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy — VendorFlow",
  description: "VendorFlow Privacy Policy. How we collect, use, and protect your personal data in compliance with GDPR and DPDP 2023.",
}

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {updated}</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-8 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Who we are</h2>
            <p className="text-muted-foreground">
              VendorFlow Technologies Pvt. Ltd. ("VendorFlow", "we", "our", "us") operates the VendorFlow platform, a multi-tenant vendor management SaaS. We are the data controller for personal data processed through our platform. Our registered office is in India.
            </p>
            <p className="text-muted-foreground mt-3">Contact: <a href="mailto:privacy@vendorflow.com" className="text-primary hover:underline">privacy@vendorflow.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Scope of this policy</h2>
            <p className="text-muted-foreground">
              This policy applies to personal data collected through our website (vendorflow.com), our SaaS platform, and any related services. It covers data about: company administrators, hiring managers, vendor users, and candidate profiles submitted through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. What personal data we collect</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-1">Account holders (company admins, hiring managers, vendor users):</p>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  <li>Name, email address, and password (hashed with bcrypt)</li>
                  <li>Company name, industry, and location</li>
                  <li>Usage data: pages visited, features used, login timestamps</li>
                  <li>IP address and browser user agent (for security and audit logs)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Candidate profiles (submitted by vendor agencies):</p>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  <li>Full name, email address, and phone number</li>
                  <li>Professional details: job title, company, years of experience, skills</li>
                  <li>Education: degree, institution, graduation year</li>
                  <li>Location and work authorisation status</li>
                  <li>Salary expectations and availability</li>
                  <li>CV / résumé document and extracted text</li>
                  <li>AI-generated summary and recommendation (derived data)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Automatically collected:</p>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  <li>Session tokens and authentication cookies</li>
                  <li>Audit log entries (actions performed, timestamps, IP addresses)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Legal basis for processing (GDPR)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-semibold">Processing activity</th>
                    <th className="text-left py-2 font-semibold">Legal basis</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Account creation and management", "Contract (Article 6(1)(b))"],
                    ["Billing and payment processing", "Contract (Article 6(1)(b))"],
                    ["Candidate profile processing for hiring", "Legitimate interests of the hiring company (Article 6(1)(f))"],
                    ["AI CV summarisation", "Legitimate interests (Article 6(1)(f))"],
                    ["Security logging and fraud prevention", "Legitimate interests (Article 6(1)(f))"],
                    ["Sending product updates and announcements", "Consent (Article 6(1)(a))"],
                    ["Compliance with legal obligations", "Legal obligation (Article 6(1)(c))"],
                  ].map(([activity, basis]) => (
                    <tr key={activity as string} className="border-b">
                      <td className="py-2 pr-4">{activity}</td>
                      <td className="py-2">{basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. How we use your data</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li>Providing and operating the VendorFlow platform</li>
              <li>Processing candidate profiles and generating AI summaries via OpenAI GPT-4o</li>
              <li>Detecting duplicate candidate submissions using AI-powered analysis</li>
              <li>Sending transactional emails (account verification, invitation, billing receipts)</li>
              <li>Maintaining security, preventing fraud, and producing audit logs</li>
              <li>Improving our services through aggregated, anonymised analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. AI processing and automated decisions</h2>
            <p className="text-muted-foreground">
              We use OpenAI's GPT-4o model to generate CV summaries and hiring recommendations. This constitutes automated processing under GDPR Article 22. The AI output is advisory only — no hiring decision is made solely on the basis of automated processing. A human hiring manager reviews all AI recommendations before any action is taken.
            </p>
            <p className="text-muted-foreground mt-3">
              Candidate profile text is sent to OpenAI's API for processing. OpenAI does not use API data to train their models. For details, see <a href="https://openai.com/policies/api-data-usage-policies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI's API data usage policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data sharing and sub-processors</h2>
            <p className="text-muted-foreground mb-3">We share data with the following categories of sub-processors:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-semibold">Sub-processor</th>
                    <th className="text-left py-2 pr-4 font-semibold">Purpose</th>
                    <th className="text-left py-2 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Supabase (PostgreSQL)", "Database hosting", "EU / US"],
                    ["Vercel", "Application hosting and edge network", "Global"],
                    ["OpenAI", "AI CV summarisation", "US"],
                    ["Cloudflare R2", "File storage (CVs, documents)", "EU / US"],
                    ["Stripe", "Payment processing", "US"],
                    ["Resend", "Transactional email delivery", "US"],
                  ].map(([name, purpose, location]) => (
                    <tr key={name as string} className="border-b">
                      <td className="py-2 pr-4 font-medium">{name}</td>
                      <td className="py-2 pr-4">{purpose}</td>
                      <td className="py-2">{location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground mt-3">We do not sell personal data to any third party. Ever.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Data retention</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li><strong>Account data:</strong> Retained for the duration of the subscription plus 90 days after cancellation, then deleted.</li>
              <li><strong>Candidate profiles:</strong> Retained for the duration of the company's subscription. Deleted within 30 days of a deletion request.</li>
              <li><strong>Audit logs:</strong> Retained for 2 years for compliance purposes.</li>
              <li><strong>Billing records:</strong> Retained for 7 years as required by tax law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Your rights (GDPR)</h2>
            <p className="text-muted-foreground mb-3">If you are in the European Economic Area, UK, or India, you have the following rights:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li><strong>Right of access</strong> — Request a copy of your personal data</li>
              <li><strong>Right to rectification</strong> — Request correction of inaccurate data</li>
              <li><strong>Right to erasure</strong> — Request deletion of your personal data</li>
              <li><strong>Right to restrict processing</strong> — Request we limit how we use your data</li>
              <li><strong>Right to data portability</strong> — Receive your data in a machine-readable format</li>
              <li><strong>Right to object</strong> — Object to processing based on legitimate interests</li>
              <li><strong>Rights related to automated decision-making</strong> — Request human review of any AI recommendation</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              To exercise any right, email <a href="mailto:privacy@vendorflow.com" className="text-primary hover:underline">privacy@vendorflow.com</a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Cookies</h2>
            <p className="text-muted-foreground">
              We use strictly necessary cookies for authentication (session management) and security (CSRF protection). We do not use tracking or advertising cookies. See our <Link href="/legal/cookies" className="text-primary hover:underline">Cookie Policy</Link> for full details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. International data transfers</h2>
            <p className="text-muted-foreground">
              Some of our sub-processors are located outside the EEA. Where this occurs, we ensure appropriate safeguards are in place — including Standard Contractual Clauses (SCCs) approved by the European Commission. A copy of our Data Processing Agreement including transfer mechanisms is available at <Link href="/legal/dpa" className="text-primary hover:underline">vendorflow.com/legal/dpa</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organisational measures to protect personal data, including: bcrypt password hashing, TLS 1.3 encryption in transit, encryption at rest, role-based access control, and comprehensive audit logging. We conduct regular security reviews.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Changes to this policy</h2>
            <p className="text-muted-foreground">
              We will notify account holders by email of any material changes to this policy at least 30 days before they take effect. The date of the most recent update is shown at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Contact and complaints</h2>
            <p className="text-muted-foreground">
              For privacy enquiries: <a href="mailto:privacy@vendorflow.com" className="text-primary hover:underline">privacy@vendorflow.com</a>
            </p>
            <p className="text-muted-foreground mt-2">
              You have the right to lodge a complaint with your local data protection authority. In India, this is the Data Protection Board under the DPDP Act 2023. In the EEA, contact your national supervisory authority.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container max-w-4xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} VendorFlow Technologies Pvt. Ltd.</span>
          <div className="flex gap-4">
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/legal/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            <Link href="/legal/dpa" className="hover:text-foreground transition-colors">DPA</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
