import { Zap } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex flex-col relative bg-sidebar overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-10" style={{ backgroundSize: "32px 32px" }} />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-sidebar/80" />

        {/* Content */}
        <div className="relative flex flex-col h-full p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">VendorFlow</span>
          </Link>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center">
            <blockquote className="space-y-4">
              <p className="text-2xl font-medium text-white leading-relaxed">
                "VendorFlow has transformed how we manage our vendor relationships. The AI-powered duplicate detection alone saves us hours every week."
              </p>
              <footer className="text-sidebar-foreground/70">
                <div className="flex items-center gap-3 mt-4">
                  <div className="h-10 w-10 rounded-full bg-primary/30 flex items-center justify-center text-sm font-semibold text-white">
                    PS
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Priya Sharma</p>
                    <p className="text-xs text-sidebar-foreground/60">Head of Talent, TechCorp India</p>
                  </div>
                </div>
              </footer>
            </blockquote>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: "500+", label: "Companies" },
              { value: "12K+", label: "Vendors" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-sidebar-foreground/60 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form panel */}
      <div className="flex flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-foreground">VendorFlow</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
    </div>
  )
}
