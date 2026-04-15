// components/admin/admin-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn, getInitials } from "@/lib/utils"
import { ROUTES } from "@/config/constants"
import {
  LayoutDashboard, Building2, CreditCard, Users,
  Brain, AlertTriangle, ScrollText, Cpu, Settings,
  LogOut, Zap, Shield,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

const NAV_ITEMS = [
  { href: ROUTES.ADMIN, label: "Platform overview", icon: LayoutDashboard, exact: true },
  { href: ROUTES.ADMIN_COMPANIES, label: "All companies", icon: Building2 },
  { href: ROUTES.ADMIN_BILLING, label: "Billing & revenue", icon: CreditCard },
  { href: ROUTES.ADMIN_VENDORS, label: "All vendors", icon: Users },
  { href: ROUTES.ADMIN_AI_USAGE, label: "AI usage & costs", icon: Brain },
  { href: ROUTES.ADMIN_DUPLICATES, label: "Duplicate stats", icon: AlertTriangle },
  { href: ROUTES.ADMIN_AUDIT_LOGS, label: "Audit logs", icon: ScrollText },
  { href: ROUTES.ADMIN_JOBS, label: "Background jobs", icon: Cpu },
  { href: ROUTES.ADMIN_SETTINGS, label: "Platform settings", icon: Settings },
]

export function AdminSidebar({ user }: { user: { name: string | null; email: string; image?: string | null } }) {
  const pathname = usePathname()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">VendorFlow</p>
          <p className="text-[10px] text-sidebar-foreground/50">Super Admin</p>
        </div>
        <Badge variant="outline" className="ml-auto text-[10px] border-red-500/40 text-red-400 bg-red-500/10">
          ADMIN
        </Badge>
      </div>

      {/* Impersonation warning bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
        <Shield className="h-3 w-3 text-amber-500 shrink-0" />
        <span className="text-[10px] text-amber-500">Platform admin mode — actions are audited</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", !active && "text-sidebar-foreground/40")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Back to main app */}
      <div className="px-3 py-2">
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          ← Back to platform
        </Link>
      </div>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar className="h-8 w-8 shrink-0">
            {user.image && <AvatarImage src={user.image} />}
            <AvatarFallback className="bg-red-500/20 text-red-400 text-xs font-semibold">
              {getInitials(user.name ?? user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name ?? "Admin"}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: ROUTES.SIGN_IN })}
            className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
