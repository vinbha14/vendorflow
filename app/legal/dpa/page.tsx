// app/legal/dpa/page.tsx
import Link from "next/link"
import { Zap, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Data Processing Agreement — VendorFlow",
  description: "VendorFlow Data Processing Agreement (DPA) — GDPR Article 28 compliant agreement for enterprise customers.",
}

export default function DpaPage() {
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
            <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/legal/cookies" className="hover:text-foreground">Cookies</Link>
            <Link href="/legal/dpa" className="hover:text-foreground font-medium text-foreground">DPA</Link>
          </nav>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Data Processing Agreement</h1>
          <p className="text-muted-foreground mb-6">Last updated: 1 January 2025 · GDPR Article 28 compliant</p>
          <div className="rounded-xl border bg-card p-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Download the full DPA</p>
              <p className="text-sm text-muted-foreground mt-1">PDF version for countersignature and your compliance records. Enterprise customers may request a customized DPA by contacting us.</p>
            </div>
            <Button asChild>
              <a href="mailto:legal@vendorflow.com?subject=DPA Request">
                <Download className="h-4 w-4 mr-2" />
                Request DPA
              </a>
            </Button>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3">1. Parties and purpose</h2>
            <p className="text-muted-foreground">This Data Processing Agreement (&ldquo;DPA&rdquo;) is entered into between VendorFlow Technologies Pvt. Ltd. (&ldquo;Processor&rdquo;) and the company subscribing to VendorFlow (&ldquo;Controller&rdquo;). It supplements the Terms of Service and governs the processing of personal data on behalf of the Controller in connection with the VendorFlow platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Subject matter and nature of processing</h2>
            <div className="rounded-lg border bg-card p-4 space-y-3">
              {[
                { label: "Subject matter", value: "Operation of the VendorFlow vendor management platform" },
                { label: "Duration", value: "For the term of the subscription agreement" },
                { label: "Nature of processing", value: "Storage, retrieval, analysis, AI summarization, duplicate detection, display, and deletion of personal data" },
                { label: "Purpose", value: "To provide the VendorFlow services as described in the Terms of Service" },
                { label: "Categories of data subjects", value: "Job candidates submitted by vendors; platform users (hiring managers, administrators, vendor contacts)" },
                { label: "Types of personal data", value: "Name, email, phone, professional history, skills, compensation, CV documents, work authorization status" },
              ].map(({ label, value }) => (
                <div key={label} className="grid grid-cols-3 gap-4 text-xs border-t pt-3 first:border-t-0 first:pt-0">
                  <span className="font-semibold text-foreground">{label}</span>
                  <span className="col-span-2 text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Obligations of the Processor (VendorFlow)</h2>
            <p className="text-muted-foreground mb-3">VendorFlow as Processor shall:</p>
            <ul className="space-y-2 text-muted-foreground">
              {[
                "Process personal data only on documented instructions from the Controller",
                "Ensure that persons authorized to process personal data are bound by confidentiality",
                "Implement appropriate technical and organizational security measures (Article 32)",
                "Assist the Controller in responding to data subject requests (Articles 12–23)",
                "Assist the Controller in meeting obligations under Articles 32–36 (security, breach notification, DPIAs)",
                "Delete or return all personal data upon termination of services at the Controller&apos;s choice",
                "Make available all information necessary to demonstrate compliance with Article 28",
                "Notify the Controller without undue delay (within 72 hours) of any personal data breach",
              ].map((item) => (
                <li key={item} className="flex gap-2"><span className="text-green-500 mt-0.5">✓</span>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Sub-processors</h2>
            <p className="text-muted-foreground mb-3">VendorFlow uses the following sub-processors. The Controller provides general authorization for VendorFlow to engage these sub-processors, subject to the conditions below:</p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Sub-processor</th>
                    <th className="text-left p-3 font-semibold">Purpose</th>
                    <th className="text-left p-3 font-semibold">Location</th>
                    <th className="text-left p-3 font-semibold">Transfer mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { name: "Supabase Inc.", purpose: "Database hosting", location: "EU-West-1 / India", mechanism: "SCCs / Adequacy" },
                    { name: "OpenAI LP", purpose: "AI CV analysis", location: "USA", mechanism: "Standard Contractual Clauses" },
                    { name: "Stripe Inc.", purpose: "Payment processing", location: "USA", mechanism: "Standard Contractual Clauses" },
                    { name: "Resend Inc.", purpose: "Transactional email", location: "USA", mechanism: "Standard Contractual Clauses" },
                    { name: "Cloudflare Inc.", purpose: "File storage (R2)", location: "EU / India", mechanism: "SCCs / Adequacy" },
                    { name: "Vercel Inc.", purpose: "Application infrastructure", location: "USA", mechanism: "Standard Contractual Clauses" },
                  ].map(({ name, purpose, location, mechanism }) => (
                    <tr key={name} className="text-muted-foreground">
                      <td className="p-3 font-medium text-foreground">{name}</td>
                      <td className="p-3">{purpose}</td>
                      <td className="p-3">{location}</td>
                      <td className="p-3">{mechanism}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground text-xs mt-3">VendorFlow will notify the Controller of intended changes to sub-processors with 30 days&apos; notice, giving the Controller the opportunity to object.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Security measures (Article 32)</h2>
            <p className="text-muted-foreground mb-3">VendorFlow implements the following technical and organizational measures:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "TLS 1.3 encryption in transit",
                "AES-256 encryption at rest",
                "Row-level security for tenant isolation",
                "Multi-factor authentication support",
                "Automated vulnerability scanning",
                "Regular security audits",
                "Principle of least privilege access controls",
                "Incident response plan with 72-hour breach notification",
              ].map((measure) => (
                <div key={measure} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  {measure}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Data subject rights assistance</h2>
            <p className="text-muted-foreground">VendorFlow will assist the Controller in fulfilling data subject rights requests including access, rectification, erasure, portability, and objection. For erasure requests, VendorFlow will delete the relevant personal data within 30 days of a verified request from the Controller.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. International transfers</h2>
            <p className="text-muted-foreground">Where personal data is transferred to countries outside the EU/EEA or India that do not have an adequacy decision, VendorFlow relies on the EU Standard Contractual Clauses (Commission Decision 2021/914) as the legal mechanism for transfer. Copies of relevant SCCs are available on request.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Term and termination</h2>
            <p className="text-muted-foreground">This DPA is effective for the duration of the VendorFlow subscription and terminates automatically upon termination of the subscription. Upon termination, VendorFlow will delete all personal data within 90 days unless the Controller requests earlier deletion or legal retention obligations apply.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Contact</h2>
            <p className="text-muted-foreground">For DPA-related enquiries, to request a countersigned copy, or to notify us of a sub-processor objection: <a href="mailto:legal@vendorflow.com" className="text-primary hover:underline">legal@vendorflow.com</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
