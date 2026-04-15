// app/layout.tsx
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { APP_NAME, APP_DESCRIPTION } from "@/config/constants"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Vendor Management Platform`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "vendor management",
    "staffing platform",
    "recruitment software",
    "HR tech",
    "vendor onboarding",
    "candidate management",
    "AI hiring",
    "SaaS",
  ],
  authors: [{ name: "VendorFlow" }],
  creator: "VendorFlow",
  metadataBase: new URL(
    process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env["NEXT_PUBLIC_APP_URL"],
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
