"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"
import { ROUTES } from "@/config/constants"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  AlertTriangle,
  BarChart3,
  CreditCard,
  Settings,
  ScrollText,
  Building2,
  LogOut,
  ChevronDown,
  Bell,
  Zap,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  badgeVariant?: "default" | "destructive" | "warning"
}

interface SidebarProps {
  user: {
    id: string
    name: string | null
    email: string
    image?: string | null
    role: string
  }
  company?: {
    name: string
    logoUrl?: string | null
    slug: string
  }
  notificationCount?: number
  duplicateAlertCount?: number
  pendingVendorCount?: number
}

const companyAdminNav: NavItem[] = [
  { href: ROUTES.DASHBOARD, label: "Overview", icon: LayoutDashboard },
  { href: ROUTES.DASHBOARD_VENDORS, label: "Vendors", icon: Building2 },
  { href: ROUTES.DASHBOARD_CANDIDATES, label: "Candidates", icon: UserCheck },
  { href: ROUTES.DASHBOARD_DUPLICATES, label: "Duplicates", icon: AlertTriangle },
  { href: ROUTES.DASHBOARD_ANALYTICS, label: "Analytics", icon: BarChart3 },
  { href: ROUTES.DASHBOARD_BILLING, label: "Billing", icon: CreditCard },
  { href: ROUTES.DASHBOARD_AUDIT_LOGS, label: "Audit Logs", icon: ScrollText },
  { href: ROUTES.DASHBOARD_SETTINGS, label: "Settings", icon: Settings },
]

function DropdownMenuImport() {
  return null
}

// Inline dropdown since we need it immediately
function UserMenu({ user }: { user: SidebarProps["user"] }) {
  return (
    <div className="relative group">
      <button className="flex w-full items-center gap-3 rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
        <Avatar className="h-8 w-8 shrink-0">
          {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
            {getInitials(user.name ?? user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium truncate text-sidebar-foreground">
            {user.name ?? "User"}
          </p>
          <p className="text-xs text-sidebar-foreground/60 truncate">
            {user.email}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-sidebar-foreground/40 shrink-0" />
      </button>
    </div>
  )
}

export function DashboardSidebar({
  user,
  company,
  notificationCount = 0,
  duplicateAlertCount = 0,
  pendingVendorCount = 0,
}: SidebarProps) {
  const pathname = usePathname()

  const navItems = companyAdminNav.map((item) => {
    if (item.href === ROUTES.DASHBOARD_DUPLICATES && duplicateAlertCount > 0) {
      return { ...item, badge: duplicateAlertCount, badgeVariant: "destructive" as const }
    }
    if (item.href === ROUTES.DASHBOARD_VENDORS && pendingVendorCount > 0) {
      return { ...item, badge: pendingVendorCount, badgeVariant: "warning" as const }
    }
    return item
  })

  const isActive = (href: string) => {
    if (href === ROUTES.DASHBOARD) return pathname === ROUTES.DASHBOARD
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo / Company Header */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        {company?.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="h-8 w-8 rounded-lg object-contain bg-white"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
            <Zap className="h-4 w-4 text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">
            {company?.name ?? "VendorFlow"}
          </p>
          {company && (
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {company.slug}.vendorflow.com
            </p>
          )}
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <Badge
          variant="outline"
          className="text-xs border-sidebar-border text-sidebar-foreground/60 bg-sidebar-accent"
        >
          {user.role === "COMPANY_ADMIN" ? "Company Admin" : "Hiring Manager"}
        </Badge>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
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
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    item.badgeVariant === "destructive"
                      ? "bg-red-500 text-white"
                      : "bg-amber-500 text-white"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Notifications */}
      <div className="px-3 py-2">
        <Link
          href="/dashboard/notifications"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
        >
          <Bell className="h-4 w-4 text-sidebar-foreground/50" />
          <span className="flex-1">Notifications</span>
          {notificationCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Link>
      </div>

      {/* User Menu */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg p-2 text-sidebar-foreground">
          <Avatar className="h-8 w-8 shrink-0">
            {user.image && <AvatarImage src={user.image} />}
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {getInitials(user.name ?? user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.name ?? "User"}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: ROUTES.SIGN_IN })}
            className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

// Dropdown menu stub to avoid import issues — full implementation in separate file
function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
function DropdownMenuTrigger({ children }: { children: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>
}
function DropdownMenuContent({ children }: { children: React.ReactNode; align?: string; className?: string }) {
  return <>{children}</>
}
function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
function DropdownMenuSeparator() {
  return null
}
function DropdownMenuItem({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <div onClick={onClick}>{children}</div>
}
