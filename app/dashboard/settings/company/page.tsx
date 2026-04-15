// app/dashboard/settings/company/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ROUTES, COUNTRIES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { CompanySettingsForm } from "@/components/settings/company-settings-form"

export const metadata = { title: "Company Settings" }

export default async function CompanySettingsPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  // Only admins can access settings
  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: tenantId } },
  })
  if (!membership || membership.role !== "COMPANY_ADMIN") redirect(ROUTES.DASHBOARD)

  const company = await prisma.company.findUnique({
    where: { id: tenantId },
  })
  if (!company) redirect(ROUTES.DASHBOARD)

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        title="Company Settings"
        description="Manage your workspace details, legal information, and regional settings."
      />
      <CompanySettingsForm company={company} />
    </div>
  )
}
