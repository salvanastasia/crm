"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { clientMobileNavItems, isNavItemActive, staffNavItems } from "@/lib/mobile-nav"
import { useAuth } from "@/components/auth-context"
import { useIsCapacitorNative } from "@/hooks/use-is-capacitor-native"
import { useMobile } from "@/hooks/use-mobile"
import { getMyUnreadNotificationCount } from "@/lib/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const NOTIFICATIONS_CHANGED = "barbercrm:notifications-changed"

export function MobileBottomNav({ docked = false }: { docked?: boolean }) {
  const pathname = usePathname() ?? ""
  const { user } = useAuth()
  const isCapacitorNative = useIsCapacitorNative()
  const isMobileViewport = useMobile()
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)

  const isStaff = user && (user.role === "admin" || user.role === "staff")
  const isClient = user?.role === "client"

  const refreshUnread = useCallback(async () => {
    if (!isClient) {
      setUnreadNotifCount(0)
      return
    }
    const n = await getMyUnreadNotificationCount()
    setUnreadNotifCount(n)
  }, [isClient])

  useEffect(() => {
    void refreshUnread()
  }, [pathname, refreshUnread])

  useEffect(() => {
    const onChange = () => void refreshUnread()
    window.addEventListener(NOTIFICATIONS_CHANGED, onChange)
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, onChange)
  }, [refreshUnread])

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
          const showProfileAvatar =
            isClient && (isCapacitorNative || isMobileViewport) && item.href === "/impostazioni"
          const showNotifUnreadDot = isClient && item.href === "/notifiche" && unreadNotifCount > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-0.5 py-1 text-center text-[10px] font-medium leading-tight text-foreground sm:text-xs",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="relative flex shrink-0 items-center justify-center">
                {showProfileAvatar ? (
                  <Avatar className="h-6 w-6 shrink-0 border border-border" aria-hidden>
                    <AvatarImage src={user?.avatarUrl || undefined} alt="" className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                )}
                {showNotifUnreadDot ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background"
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className="line-clamp-2 w-full break-words hyphens-auto [overflow-wrap:anywhere]">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
