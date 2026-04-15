// components/vendor/vendor-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn, getInitials } from "@/lib/utils"
import { ROUTES } from "@/config/constants"
import {
  LayoutDashboard, Building2, UserCheck, FileText,
  Bell, Settings, LogOut, Zap, ChevronRight,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface VendorSidebarProps {
  user: { id: string; name: string | null; email: string; image?: string | null }
  vendor: { id: string; name: string; logoUrl?: string | null; role: "ADMIN" | "RECRUITER" }
  assignedCompanies: Array<{ id: string; name: string; logoUrl?: string | null; primaryColor: string }>
  notificationCount?: number
}

const navItems = [
  { href: ROUTES.VENDOR, label: "Overview", icon: LayoutDashboard, exact: true },
  { href: ROUTES.VENDOR_COMPANIES, label: "My Companies", icon: Building2 },
  { href: ROUTES.VENDOR_CANDIDATES, label: "Candidates", icon: UserCheck },
  { href: ROUTES.VENDOR_DOCUMENTS, label: "Documents", icon: FileText },
]

export function VendorSidebar({ user, vendor, assignedCompanies, notificationCount = 0 }: VendorSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Vendor identity */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        {vendor.logoUrl ? (
          <img src={vendor.logoUrl} alt={vendor.name} className="h-8 w-8 rounded-lg object-contain bg-white" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
            <Zap className="h-4 w-4 text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{vendor.name}</p>
          <p className="text-xs text-sidebar-foreground/50 capitalize">
            {vendor.role.toLowerCase()} account
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
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
              <Icon className={cn("h-4 w-4 shrink-0", active ? "" : "text-sidebar-foreground/50")} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.href === ROUTES.VENDOR_COMPANIES && assignedCompanies.length > 0 && (
                <span className="text-xs text-sidebar-foreground/40">{assignedCompanies.length}</span>
              )}
            </Link>
          )
        })}

        {/* Assigned companies section */}
        {assignedCompanies.length > 0 && (
          <>
            <Separator className="bg-sidebar-border my-2" />
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
              Assigned companies
            </p>
            {assignedCompanies.map((company) => (
              <Link
                key={company.id}
                href={`${ROUTES.VENDOR_COMPANIES}/${company.id}`}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
              >
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="h-5 w-5 rounded object-contain bg-white shrink-0"
                  />
                ) : (
                  <div
                    className="h-5 w-5 rounded shrink-0 flex items-center justify-center text-white text-[8px] font-bold"
                    style={{ backgroundColor: company.primaryColor }}
                  >
                    {company.name[0]}
                  </div>
                )}
                <span className="flex-1 truncate">{company.name}</span>
                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </>
        )}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Notifications */}
      <div className="px-3 py-2">
        <Link
          href={ROUTES.VENDOR + "/notifications"}
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
        <Link
          href={ROUTES.VENDOR + "/settings"}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
        >
          <Settings className="h-4 w-4 text-sidebar-foreground/50" />
          <span>Settings</span>
        </Link>
      </div>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar className="h-8 w-8 shrink-0">
            {user.image && <AvatarImage src={user.image} />}
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
              {getInitials(user.name ?? user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name ?? "Vendor"}</p>
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
