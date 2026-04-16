// app/dashboard/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, UserCheck, AlertTriangle, TrendingUp, Plus, ArrowRight, Users } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Dashboard — VendorFlow" }

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  let companyId: string | null = null
  try {
    const membership = await prisma.companyMember.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: { companyId: true },
    })
    companyId = membership?.companyId ?? null
  } catch (err) {
    console.error("[Dashboard] error finding membership:", err)
  }

  if (!companyId) redirect(ROUTES.ONBOARDING_COMPANY)

  // Fetch stats with individual error handling
  let approvedVendors = 0, pendingVendors = 0
  let totalSubmissions = 0, shortlisted = 0, hired = 0, underReview = 0
  let duplicateAlerts = 0
  let recentSubmissions: any[] = []
  let subscription: any = null

  try {
    const vendorStats = await prisma.vendorCompany.groupBy({
      by: ["status"], where: { companyId }, _count: true,
    })
    approvedVendors = vendorStats.find(s => s.status === "APPROVED")?._count ?? 0
    pendingVendors = vendorStats.find(s => s.status === "PENDING")?._count ?? 0
  } catch { /* keep 0 */ }

  try {
    const subStats = await prisma.candidateSubmission.groupBy({
      by: ["status"], where: { companyId }, _count: true,
    })
    totalSubmissions = subStats.reduce((s, r) => s + r._count, 0)
    shortlisted = subStats.find(s => s.status === "SHORTLISTED")?._count ?? 0
    hired = subStats.find(s => s.status === "HIRED")?._count ?? 0
    underReview = subStats.find(s => s.status === "UNDER_REVIEW")?._count ?? 0
  } catch { /* keep 0 */ }

  try {
    duplicateAlerts = await prisma.duplicateAlert.count({ where: { companyId, status: "OPEN" } })
  } catch { /* keep 0 */ }

  try {
    recentSubmissions = await prisma.candidateSubmission.findMany({
      where: { companyId },
      orderBy: { submittedAt: "desc" },
      take: 8,
      include: {
        profile: { select: { fullName: true, currentTitle: true, skills: true } },
        vendor: { select: { name: true } },
      },
    })
  } catch { /* keep empty */ }

  try {
    subscription = await prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    })
  } catch { /* keep null */ }

  const maxVendors = subscription?.plan?.maxVendors ?? 10
  const usagePct = maxVendors === -1 ? 0 : Math.round((approvedVendors / maxVendors) * 100)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Good {greeting}, {session.user.name?.split(" ")[0] ?? "there"}</p>
        </div>
        <Button asChild>
          <Link href={ROUTES.DASHBOARD_VENDORS_INVITE}><Plus className="h-4 w-4" />Invite Vendor</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Active Vendors", value: approvedVendors, sub: maxVendors === -1 ? "Unlimited" : `of ${maxVendors} on plan`, icon: Building2, color: "text-blue-500" },
          { title: "Total Submissions", value: totalSubmissions, sub: `${underReview} under review`, icon: UserCheck, color: "text-purple-500" },
          { title: "Shortlisted", value: shortlisted, sub: `${hired} hired`, icon: TrendingUp, color: "text-green-500" },
          { title: "Duplicate Alerts", value: duplicateAlerts, sub: duplicateAlerts === 0 ? "All clear" : "Needs review", icon: AlertTriangle, color: duplicateAlerts > 0 ? "text-amber-500" : "text-green-500" },
        ].map(({ title, value, sub, icon: Icon, color }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent Submissions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.DASHBOARD_CANDIDATES} className="text-xs">View all <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentSubmissions.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No submissions yet. Invite vendors to get started.
                </p>
              ) : (
                <div className="divide-y">
                  {recentSubmissions.map((sub) => (
                    <div key={sub.id} className="flex items-start gap-4 px-6 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                        {(sub.profile.fullName?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sub.profile.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sub.profile.currentTitle ?? "—"} · via {sub.vendor.name}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {new Date(sub.submittedAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {subscription && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Plan Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Vendors</span>
                    <span className="font-medium">{approvedVendors}{maxVendors !== -1 && ` / ${maxVendors}`}</span>
                  </div>
                  {maxVendors !== -1 && (
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full ${usagePct > 80 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${Math.min(usagePct, 100)}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="text-sm font-medium">{subscription.plan?.displayName} Plan</p>
                    <p className="text-xs text-muted-foreground capitalize">{subscription.billingCycle?.toLowerCase()} billing</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={ROUTES.DASHBOARD_BILLING}>Manage</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { href: ROUTES.DASHBOARD_VENDORS_INVITE, icon: Building2, label: "Invite a vendor" },
                { href: ROUTES.DASHBOARD_CANDIDATES, icon: UserCheck, label: "Review candidates" },
                { href: ROUTES.DASHBOARD_DUPLICATES, icon: AlertTriangle, label: "Review duplicates", badge: duplicateAlerts },
                { href: ROUTES.DASHBOARD_SETTINGS_BRANDING, icon: Users, label: "Update branding" },
              ].map(({ href, icon: Icon, label, badge }) => (
                <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{label}</span>
                  {badge ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{badge}</span>
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
