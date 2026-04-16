// app/vendor/layout.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ROUTES } from "@/config/constants"
import { VendorSidebar } from "@/components/vendor/vendor-sidebar"

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  // Get vendor context
  const vendorUser = await prisma.vendorUser.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: {
      vendor: {
        include: {
          companyRelationships: {
            where: { status: "APPROVED" },
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                  country: true,
                  branding: {
                    select: { primaryColor: true, secondaryColor: true, tagline: true },
                  },
                },
              },
            },
            orderBy: { approvedAt: "desc" },
          },
        },
      },
    },
  })

  if (!vendorUser) {
    // User has no vendor association — redirect to appropriate place
    redirect(ROUTES.SIGN_IN)
  }

  const unreadNotifications = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  })

  return (
    <div className="flex min-h-screen bg-background">
      <VendorSidebar
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        vendor={{
          id: vendorUser.vendorId,
          name: vendorUser.vendor.name,
          logoUrl: vendorUser.vendor.logoUrl,
          role: vendorUser.role as "ADMIN" | "RECRUITER",
        }}
        assignedCompanies={vendorUser.vendor.companyRelationships.map((vc) => ({
          id: vc.company.id,
          name: vc.company.name,
          logoUrl: vc.company.logoUrl,
          primaryColor: vc.company.branding?.primaryColor ?? "#4F46E5",
        }))}
        notificationCount={unreadNotifications}
      />
      <div className="flex flex-1 flex-col pl-64">
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl py-8 px-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
