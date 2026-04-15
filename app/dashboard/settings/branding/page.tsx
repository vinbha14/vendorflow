// app/dashboard/settings/branding/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { BrandingSettingsForm } from "@/components/settings/branding-settings-form"

export const metadata = { title: "Branding Settings" }

export default async function BrandingSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  const membership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: tenantId } },
  })
  if (!membership || membership.role !== "COMPANY_ADMIN") redirect(ROUTES.DASHBOARD)

  const company = await prisma.company.findUnique({
    where: { id: tenantId },
    include: { branding: true },
  })
  if (!company) redirect(ROUTES.DASHBOARD)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Branding"
        description="Customize how your company appears to vendors in their portal."
      />
      <BrandingSettingsForm
        companyId={tenantId}
        company={company}
        branding={company.branding}
      />
    </div>
  )
}
