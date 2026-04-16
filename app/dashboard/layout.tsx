// app/dashboard/layout.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ROUTES } from "@/config/constants"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { UserGlobalRole } from "@prisma/client"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) redirect(ROUTES.SIGN_IN)

  if (session.user.globalRole === UserGlobalRole.SUPER_ADMIN) {
    redirect(ROUTES.ADMIN)
  }

  // Find the user's company membership directly — no subdomain needed
  let membership = null
  try {
    membership = await prisma.companyMember.findFirst({
      where: { userId: session.user.id, isActive: true },
      include: {
        company: {
          include: {
            branding: true,
            subscription: { include: { plan: true } },
          },
        },
      },
    })
  } catch (err) {
    console.error("[DashboardLayout] membership error:", err)
    redirect(ROUTES.SIGN_IN)
  }

  if (!membership) redirect(ROUTES.ONBOARDING_COMPANY)

  const { company } = membership
  const tenantId = company.id

  // Fetch sidebar badge counts
  let notificationCount = 0
  let duplicateAlertCount = 0
  let pendingVendorCount = 0

  try {
    const [notifs, dupes, pending] = await Promise.all([
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
      prisma.duplicateAlert.count({
        where: { companyId: tenantId, status: "OPEN" },
      }),
      prisma.vendorCompany.count({
        where: { companyId: tenantId, status: "PENDING" },
      }),
    ])
    notificationCount = notifs
    duplicateAlertCount = dupes
    pendingVendorCount = pending
  } catch (err) {
    console.error("[DashboardLayout] badge counts error:", err)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: membership.role,
        }}
        company={{
          name: company.name,
          logoUrl: company.logoUrl,
          slug: company.slug,
        }}
        notificationCount={notificationCount}
        duplicateAlertCount={duplicateAlertCount}
        pendingVendorCount={pendingVendorCount}
      />

      <div className="flex flex-1 flex-col pl-64">
        <DashboardHeader notificationCount={notificationCount} />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl py-8 px-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
