// app/(marketing)/legal/dpa/page.tsx
import Link from "next/link"
import { Zap, ArrowLeft, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Data Processing Agreement — VendorFlow",
  description: "VendorFlow GDPR Article 28 Data Processing Agreement for enterprise customers.",
}

export default function DpaPage() {
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
        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Data Processing Agreement</h1>
          <p className="text-muted-foreground">Last updated: {updated} · GDPR Article 28 compliant</p>
        </div>

        <div className="rounded-xl border bg-primary/5 border-primary/20 p-6 mb-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold mb-1">Need a signed DPA?</p>
            <p className="text-sm text-muted-foreground max-w-lg">
              Enterprise customers may request a countersigned DPA. Email us and we'll turn it around within 2 business days.
            </p>
          </div>
          <Button asChild>
            <a href="mailto:legal@vendorflow.com?subject=DPA Request">
              Request signed DPA
            </a>
          </Button>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Parties and definitions</h2>
            <p className="text-muted-foreground">
              This Data Processing Agreement ("DPA") is entered into between VendorFlow Technologies Pvt. Ltd. ("Processor") and the customer entity that has agreed to the VendorFlow Terms of Service ("Controller").
            </p>
            <div className="mt-4 space-y-2 text-muted-foreground">
              <p><strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person, as defined in GDPR Article 4(1).</p>
              <p><strong>"Processing"</strong> means any operation performed on personal data, as defined in GDPR Article 4(2).</p>
              <p><strong>"GDPR"</strong> means Regulation (EU) 2016/679 of the European Parliament and of the Council.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Subject matter and nature of processing</h2>
            <p className="text-muted-foreground">
              VendorFlow processes personal data on behalf of the Controller solely for the purpose of providing the VendorFlow platform services as described in the Terms of Service. Processing includes: storing candidate profile data, generating AI summaries, detecting duplicate submissions, and sending transactional communications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Categories of data subjects and personal data</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-semibold">Data subjects</th>
                    <th className="text-left py-2 font-semibold">Categories of personal data</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Company administrators and hiring managers", "Name, email, IP address, usage data"],
                    ["Vendor agency users", "Name, email, company affiliation"],
                    ["Job candidates", "Name, email, phone, professional history, CV documents, location, salary expectations, work authorisation"],
                  ].map(([subjects, data]) => (
                    <tr key={subjects as string} className="border-b">
                      <td className="py-2 pr-4">{subjects}</td>
                      <td className="py-2">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Obligations of the Processor</h2>
            <p className="text-muted-foreground mb-3">VendorFlow (Processor) undertakes to:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li>Process personal data only on documented instructions from the Controller</li>
              <li>Ensure that persons authorised to process personal data are bound by confidentiality obligations</li>
              <li>Implement appropriate technical and organisational security measures (Article 32)</li>
              <li>Assist the Controller in fulfilling obligations relating to data subject rights</li>
              <li>Delete or return all personal data on termination of services</li>
              <li>Make available all information necessary to demonstrate compliance with this DPA</li>
              <li>Not engage sub-processors without prior consent from the Controller</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Sub-processors</h2>
            <p className="text-muted-foreground mb-3">
              The Controller grants general authorisation for VendorFlow to engage the following sub-processors. VendorFlow will notify the Controller of changes with 30 days' notice.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-semibold">Sub-processor</th>
                    <th className="text-left py-2 pr-4 font-semibold">Processing activity</th>
                    <th className="text-left py-2 font-semibold">Transfer mechanism</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Supabase", "Database hosting", "SCCs"],
                    ["Vercel", "Application hosting", "SCCs"],
                    ["OpenAI", "AI CV summarisation", "SCCs + DPA"],
                    ["Cloudflare R2", "File storage", "SCCs"],
                    ["Stripe", "Payment processing", "SCCs"],
                    ["Resend", "Email delivery", "SCCs"],
                  ].map(([name, activity, mechanism]) => (
                    <tr key={name as string} className="border-b">
                      <td className="py-2 pr-4 font-medium">{name}</td>
                      <td className="py-2 pr-4">{activity}</td>
                      <td className="py-2">{mechanism}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">SCCs = Standard Contractual Clauses (EU Commission Decision 2021/914)</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Security measures (Article 32)</h2>
            <p className="text-muted-foreground mb-3">VendorFlow has implemented the following measures:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li>Encryption in transit: TLS 1.3 minimum on all connections</li>
              <li>Encryption at rest: AES-256 on all stored data</li>
              <li>Password hashing: bcrypt with cost factor 12</li>
              <li>Access control: role-based access, principle of least privilege</li>
              <li>Audit logging: every data access and modification is logged</li>
              <li>Tenant isolation: complete data separation between customer organisations</li>
              <li>Regular security reviews and vulnerability assessments</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data subject rights assistance</h2>
            <p className="text-muted-foreground">
              VendorFlow will assist the Controller in responding to data subject rights requests (access, rectification, erasure, portability, objection) within the timeframes set by applicable law. Requests should be submitted to <a href="mailto:privacy@vendorflow.com" className="text-primary hover:underline">privacy@vendorflow.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Data breach notification</h2>
            <p className="text-muted-foreground">
              VendorFlow will notify the Controller without undue delay, and in any event within 72 hours, after becoming aware of a personal data breach affecting the Controller's data. The notification will include the categories and approximate number of data subjects affected, likely consequences, and measures taken or proposed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Duration and termination</h2>
            <p className="text-muted-foreground">
              This DPA remains in force for the duration of the Services agreement. Upon termination, VendorFlow will delete or return all personal data within 90 days, unless retention is required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
            <p className="text-muted-foreground">
              Data protection enquiries: <a href="mailto:privacy@vendorflow.com" className="text-primary hover:underline">privacy@vendorflow.com</a><br />
              To request a countersigned DPA: <a href="mailto:legal@vendorflow.com" className="text-primary hover:underline">legal@vendorflow.com</a>
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container max-w-4xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} VendorFlow Technologies Pvt. Ltd.</span>
          <div className="flex gap-4">
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/legal/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
