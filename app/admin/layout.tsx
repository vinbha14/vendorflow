// app/admin/layout.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ROUTES } from "@/config/constants"
import { UserGlobalRole } from "@prisma/client"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) redirect(ROUTES.SIGN_IN)
  if (session.user.globalRole !== UserGlobalRole.SUPER_ADMIN) redirect(ROUTES.DASHBOARD)

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <div className="flex flex-1 flex-col pl-64">
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl py-8 px-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
