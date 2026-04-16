// app/legal/cookies/page.tsx
import Link from "next/link"
import { Zap } from "lucide-react"

export const metadata = {
  title: "Cookie Policy — VendorFlow",
  description: "VendorFlow Cookie Policy — what cookies we use, why, and how to control them.",
}

export default function CookiesPage() {
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
            <Link href="/legal/cookies" className="hover:text-foreground font-medium text-foreground">Cookies</Link>
            <Link href="/legal/dpa" className="hover:text-foreground">DPA</Link>
          </nav>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Cookie Policy</h1>
          <p className="text-muted-foreground">Last updated: 1 January 2025</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3">What are cookies?</h2>
            <p className="text-muted-foreground">Cookies are small text files placed on your device when you visit a website. They allow the website to remember your actions and preferences over time, so you don&apos;t have to re-enter them each time you visit.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Cookies we use</h2>
            <div className="space-y-4">
              {[
                {
                  category: "Strictly necessary",
                  description: "Required for the platform to function. Cannot be disabled.",
                  legal: "No consent required — legitimate interest in service delivery.",
                  cookies: [
                    { name: "session_token", purpose: "Maintains your logged-in session", duration: "Session / 30 days", provider: "VendorFlow" },
                    { name: "csrf_token", purpose: "Prevents cross-site request forgery attacks", duration: "Session", provider: "VendorFlow" },
                  ],
                },
                {
                  category: "Functional",
                  description: "Remember your preferences to improve your experience.",
                  legal: "Consent required for non-essential functional cookies.",
                  cookies: [
                    { name: "theme_preference", purpose: "Remembers light/dark mode preference", duration: "1 year", provider: "VendorFlow" },
                    { name: "sidebar_state", purpose: "Remembers whether sidebar is collapsed", duration: "30 days", provider: "VendorFlow" },
                  ],
                },
                {
                  category: "Analytics",
                  description: "Help us understand how the platform is used, so we can improve it. All data is anonymized.",
                  legal: "Consent required. You may opt out at any time.",
                  cookies: [
                    { name: "Analytics cookies", purpose: "Anonymous usage statistics — no personal data shared with third parties", duration: "90 days", provider: "VendorFlow (self-hosted)" },
                  ],
                },
              ].map(({ category, description, legal, cookies }) => (
                <div key={category} className="rounded-xl border bg-card overflow-hidden">
                  <div className="p-4 border-b bg-secondary/30">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{category} cookies</p>
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 italic">{legal}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-secondary/20">
                        <tr>
                          <th className="text-left p-3 font-medium">Cookie name</th>
                          <th className="text-left p-3 font-medium">Purpose</th>
                          <th className="text-left p-3 font-medium">Duration</th>
                          <th className="text-left p-3 font-medium">Provider</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {cookies.map((cookie) => (
                          <tr key={cookie.name} className="text-muted-foreground">
                            <td className="p-3 font-mono">{cookie.name}</td>
                            <td className="p-3">{cookie.purpose}</td>
                            <td className="p-3">{cookie.duration}</td>
                            <td className="p-3">{cookie.provider}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Managing your cookie preferences</h2>
            <p className="text-muted-foreground mb-4">You can control cookies through several methods:</p>
            <div className="space-y-3">
              {[
                { method: "Browser settings", desc: "Most browsers allow you to block or delete cookies through their settings. Note that blocking strictly necessary cookies will prevent you from logging in." },
                { method: "Our cookie banner", desc: "When you first visit VendorFlow, you can set your preferences for optional cookies using our consent banner." },
                { method: "Opt-out links", desc: "For any third-party analytics tools we use, opt-out links are provided in the relevant cookie entry above." },
              ].map(({ method, desc }) => (
                <div key={method} className="rounded-lg border bg-card p-4">
                  <p className="font-semibold text-sm mb-1">{method}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Third-party cookies</h2>
            <p className="text-muted-foreground">VendorFlow does not use third-party advertising or tracking cookies. We do not share cookie data with advertisers or data brokers. Any third-party services we integrate with (such as Stripe for payments) set their own cookies subject to their own privacy policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Changes to this policy</h2>
            <p className="text-muted-foreground">We may update this Cookie Policy when we change the cookies we use. Significant changes will be communicated via our consent banner so you can review and update your preferences.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Questions</h2>
            <p className="text-muted-foreground">For questions about our use of cookies: <a href="mailto:privacy@vendorflow.com" className="text-primary hover:underline">privacy@vendorflow.com</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
