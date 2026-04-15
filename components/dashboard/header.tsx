"use client"

import { Bell, Search, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  title?: string
  notificationCount?: number
  className?: string
}

export function DashboardHeader({
  title,
  notificationCount = 0,
  className,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6",
        className
      )}
    >
      {/* Search */}
      <div className="flex flex-1 items-center gap-2 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates, vendors..."
            className="pl-8 h-9 bg-secondary border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Help */}
        <Button variant="ghost" size="icon-sm" asChild>
          <a href="https://docs.vendorflow.com" target="_blank" rel="noopener noreferrer">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </a>
        </Button>

        {/* Notifications */}
        <Link href="/dashboard/notifications">
          <Button variant="ghost" size="icon-sm" className="relative">
            <Bell className="h-4 w-4 text-muted-foreground" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Button>
        </Link>
      </div>
    </header>
  )
}
