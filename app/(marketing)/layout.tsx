// app/(marketing)/layout.tsx
// The marketing layout is essentially transparent — 
// the homepage embeds its own NavBar and Footer.
// This wrapper exists so Next.js can scope metadata to this route group.

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
