"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { clientMobileNavItems, isNavItemActive, staffNavItems } from "@/lib/mobile-nav"
import { useAuth } from "@/components/auth-context"
import { useIsCapacitorNative } from "@/hooks/use-is-capacitor-native"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function MobileBottomNav({ docked = false }: { docked?: boolean }) {
  const pathname = usePathname() ?? ""
  const { user } = useAuth()
  const isCapacitorNative = useIsCapacitorNative()

  const isStaff = user && (user.role === "admin" || user.role === "staff")
  const isClient = user?.role === "client"

  const items = isStaff ? staffNavItems : isClient ? clientMobileNavItems : null
  if (!items) return null

  const n = items.length

  return (
    <nav
      className={cn(
        "z-40 box-border w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex flex-col",
        docked
          ? "relative shrink-0"
          : "fixed inset-x-0 bottom-0",
        !docked && !isCapacitorNative && "md:hidden",
      )}
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
      aria-label="Navigazione principale"
    >
      <div
        className={cn(
          "grid h-14 min-h-14 w-full min-w-0 shrink-0 items-stretch gap-0 px-0.5",
          n === 5 ? "grid-cols-5" : "grid-cols-4",
        )}
      >
        {items.map((item) => {
          const Icon = item.icon
          const active = isNavItemActive(pathname, item.href)
          const profiloCapacitor =
            isCapacitorNative && isClient && item.href === "/impostazioni"
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-0.5 py-1 text-center text-[10px] font-medium leading-tight text-foreground sm:text-xs",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {profiloCapacitor ? (
                <Avatar className="h-6 w-6 shrink-0 border border-border" aria-hidden>
                  <AvatarImage src={user?.avatarUrl || undefined} alt="" className="object-cover" />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
              )}
              <span className="line-clamp-2 w-full break-words hyphens-auto [overflow-wrap:anywhere]">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
