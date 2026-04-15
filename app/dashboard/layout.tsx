import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
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

  // Redirect unauthenticated users
  if (!session?.user) {
    redirect(ROUTES.SIGN_IN)
  }

  // Super admin should be in /admin
  if (session.user.globalRole === UserGlobalRole.SUPER_ADMIN) {
    redirect(ROUTES.ADMIN)
  }

  const { tenantId } = await getTenantFromHeaders()

  // If no tenant context, redirect to sign-in (shouldn't happen in normal flow)
  if (!tenantId) {
    // Try to find the user's company
    const membership = await prisma.companyMember.findFirst({
      where: { userId: session.user.id, isActive: true },
      include: { company: true },
    })

    if (!membership) {
      // No company — send to onboarding
      redirect(ROUTES.ONBOARDING_COMPANY)
    }

    // Redirect to their company subdomain
    const companySubdomain = membership.company.subdomain
    const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"
    const domain = process.env["NEXT_PUBLIC_APP_DOMAIN"] ?? "localhost:3000"
    const protocol = domain.includes("localhost") ? "http" : "https"
    redirect(`${protocol}://${companySubdomain}.${domain}/dashboard`)
  }

  // Validate user has access to this company
  const membership = await prisma.companyMember.findUnique({
    where: {
      userId_companyId: {
        userId: session.user.id,
        companyId: tenantId,
      },
    },
    include: {
      company: {
        include: {
          branding: true,
          subscription: {
            include: { plan: true },
          },
        },
      },
    },
  })

  if (!membership || !membership.isActive) {
    redirect(ROUTES.SIGN_IN)
  }

  // Fetch notification and alert counts for sidebar badges
  const [notificationCount, duplicateAlertCount, pendingVendorCount] =
    await Promise.all([
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

  const { company } = membership

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
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

      {/* Main content area */}
      <div className="flex flex-1 flex-col pl-64">
        <DashboardHeader notificationCount={notificationCount} />

        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl py-8 px-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
