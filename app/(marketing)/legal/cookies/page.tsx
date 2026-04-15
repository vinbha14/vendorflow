// app/(marketing)/legal/cookies/page.tsx
import Link from "next/link"
import { Zap, ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Cookie Policy — VendorFlow",
  description: "VendorFlow Cookie Policy. How we use cookies and your choices.",
}

export default function CookiePolicyPage() {
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
          <h1 className="text-4xl font-bold tracking-tight mb-3">Cookie Policy</h1>
          <p className="text-muted-foreground">Last updated: {updated}</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold mb-3">What are cookies?</h2>
            <p className="text-muted-foreground">
              Cookies are small text files placed on your device by websites you visit. They are used to make websites work properly, to remember your preferences, and to provide information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">How we use cookies</h2>
            <p className="text-muted-foreground mb-4">
              We use a minimal set of cookies. We do not use advertising cookies, tracking cookies, or sell data to third parties.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-secondary/30">
                    <th className="text-left py-3 px-3 font-semibold">Cookie name</th>
                    <th className="text-left py-3 px-3 font-semibold">Type</th>
                    <th className="text-left py-3 px-3 font-semibold">Purpose</th>
                    <th className="text-left py-3 px-3 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["next-auth.session-token", "Strictly necessary", "Maintains your authenticated session. Required for the platform to function.", "30 days"],
                    ["next-auth.csrf-token", "Strictly necessary", "Protects against Cross-Site Request Forgery attacks.", "Session"],
                    ["next-auth.callback-url", "Strictly necessary", "Stores the URL to redirect to after sign-in.", "Session"],
                    ["__Secure-next-auth.session-token", "Strictly necessary", "Secure version of session token (HTTPS only).", "30 days"],
                  ].map(([name, type, purpose, duration]) => (
                    <tr key={name as string} className="border-b">
                      <td className="py-3 px-3 font-mono text-xs">{name}</td>
                      <td className="py-3 px-3">
                        <span className="rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-xs font-medium">{type}</span>
                      </td>
                      <td className="py-3 px-3">{purpose}</td>
                      <td className="py-3 px-3">{duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Strictly necessary cookies</h2>
            <p className="text-muted-foreground">
              All cookies we use are strictly necessary for the platform to function. They do not require your consent under the ePrivacy Directive or GDPR because they are essential for you to use the service you have requested. You cannot opt out of these cookies if you wish to use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">What we do NOT use</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li>Analytics cookies (no Google Analytics, Mixpanel, or similar)</li>
              <li>Advertising or targeting cookies</li>
              <li>Social media tracking pixels</li>
              <li>Third-party tracking scripts</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We may use a self-hosted analytics tool (PostHog) with IP anonymisation and no cross-site tracking. This does not use cookies and is opt-out by default.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Managing cookies</h2>
            <p className="text-muted-foreground">
              You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that blocking strictly necessary cookies will prevent the platform from functioning. For guidance, see your browser's help documentation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground">
              Questions about cookies: <a href="mailto:privacy@vendorflow.com" className="text-primary hover:underline">privacy@vendorflow.com</a>
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
            <Link href="/legal/dpa" className="hover:text-foreground transition-colors">DPA</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
