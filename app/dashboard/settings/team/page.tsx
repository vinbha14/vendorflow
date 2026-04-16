// app/dashboard/settings/team/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTenantFromHeaders } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { ROUTES } from "@/config/constants"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InviteTeamMemberForm } from "@/components/settings/invite-team-member-form"
import { getInitials, formatDate } from "@/lib/utils"
import { Users, Crown, UserCog } from "lucide-react"

export const metadata = { title: "Team Settings" }

export default async function TeamSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect(ROUTES.SIGN_IN)

  const { tenantId } = await getTenantFromHeaders()
  if (!tenantId) redirect(ROUTES.SIGN_IN)

  const currentMembership = await prisma.companyMember.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId: tenantId } },
  })
  if (!currentMembership || currentMembership.role !== "COMPANY_ADMIN") redirect(ROUTES.DASHBOARD)

  const [members, pendingInvitations, subscription] = await Promise.all([
    prisma.companyMember.findMany({
      where: { companyId: tenantId, isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, lastLoginAt: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { companyId: tenantId, type: "TEAM_MEMBER", status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findUnique({
      where: { companyId: tenantId },
      include: { plan: { select: { maxTeamMembers: true, displayName: true } } },
    }),
  ])

  const maxMembers = subscription?.plan.maxTeamMembers ?? 5
  const canAddMore = maxMembers === -1 || members.length < maxMembers

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        title="Team"
        description="Manage who has access to your workspace and their roles."
      />

      {/* Plan limit */}
      {maxMembers !== -1 && (
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>
            <strong>{members.length}</strong> of <strong>{maxMembers}</strong> team members used
            {members.length >= maxMembers && (
              <span className="text-amber-600 ml-2">· Limit reached</span>
            )}
          </span>
          {members.length >= maxMembers && (
            <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" asChild>
              <a href={ROUTES.DASHBOARD_BILLING}>Upgrade plan</a>
            </Button>
          )}
        </div>
      )}

      {/* Current members */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            Team members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {members.map((member) => {
              const isCurrentUser = member.userId === session.user.id
              return (
                <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                  <Avatar className="h-9 w-9 shrink-0">
                    {member.user.image && <AvatarImage src={member.user.image} />}
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {getInitials(member.user.name ?? member.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{member.user.name ?? "—"}</p>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                    {member.user.lastLoginAt && (
                      <p className="text-xs text-muted-foreground/60">
                        Last active {formatDate(member.user.lastLoginAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={member.role === "COMPANY_ADMIN" ? "purple" : "blue"}
                      className="gap-1.5 text-xs"
                    >
                      {member.role === "COMPANY_ADMIN" ? (
                        <><Crown className="h-2.5 w-2.5" /> Admin</>
                      ) : (
                        <><UserCog className="h-2.5 w-2.5" /> Hiring Manager</>
                      )}
                    </Badge>
                    {!isCurrentUser && (
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive h-7">
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Pending invitations ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited {formatDate(inv.createdAt)} · Expires {formatDate(inv.expiresAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="amber" className="text-xs">Pending</Badge>
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite new member */}
      {canAddMore && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Invite a team member</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteTeamMemberForm companyId={tenantId} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
