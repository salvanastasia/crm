"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { clientMobileNavItems, isNavItemActive, staffNavItems } from "@/lib/mobile-nav"
import { useAuth } from "@/components/auth-context"

export function MobileBottomNav() {
  const pathname = usePathname() ?? ""
  const { user } = useAuth()

  const isStaff = user && (user.role === "admin" || user.role === "staff")
  const isClient = user?.role === "client"

  const items = isStaff ? staffNavItems : isClient ? clientMobileNavItems : null
  if (!items) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navigazione principale"
    >
      <div className="flex h-14 items-stretch justify-around gap-0.5 px-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = isNavItemActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1 text-[10px] font-medium leading-none sm:text-xs",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate text-center w-full">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
