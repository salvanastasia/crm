"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-context"
import { useIsCapacitorNative } from "@/hooks/use-is-capacitor-native"
import { useMobile } from "@/hooks/use-mobile"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { CapacitorDeepLinkBridge } from "@/components/capacitor-deep-link-bridge"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const { user, isAuthenticated, isLoading } = useAuth()
  const isCapacitorNative = useIsCapacitorNative()
  const isMobileViewport = useMobile()

  const isClientBookingFlow = user?.role === "client" && pathname.startsWith("/booking")
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/update-password")

  const shouldShowHeader = !isAuthPage
  /** Cliente su browser mobile e app Capacitor: niente header (navigazione in bottom bar + safe area sul main). */
  const hideClientHeaderOnCompact =
    user?.role === "client" && (isMobileViewport || isCapacitorNative)

  const navEligible =
    !isLoading &&
    isAuthenticated &&
    !isAuthPage &&
    user != null &&
    (user.role === "admin" || user.role === "staff" || user.role === "client")

  /** Scroll solo nel main: evita rubber-band su body che “allunga” header/nav (iOS / Capacitor) */
  const dockedChrome = Boolean(navEligible && (isCapacitorNative || isMobileViewport))

  useEffect(() => {
    if (!dockedChrome) return
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = "hidden"
    body.style.overflow = "hidden"
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [dockedChrome])

  const mainBottomPad = cn(
    dockedChrome
      ? undefined
      : navEligible &&
          (isCapacitorNative
            ? "pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]"
            : "max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]"),
  )

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        dockedChrome ? "h-[100dvh] max-h-[100dvh] overflow-hidden" : "min-h-screen",
      )}
    >
      {isCapacitorNative && <CapacitorDeepLinkBridge />}
      {shouldShowHeader && !hideClientHeaderOnCompact && <Header dockedChrome={dockedChrome} />}
      <main
        className={cn(
          "min-w-0",
          dockedChrome ? "min-h-0 flex-1 overflow-y-auto overscroll-y-contain" : "flex-1",
          dockedChrome && hideClientHeaderOnCompact && "pt-[env(safe-area-inset-top,0px)]",
          mainBottomPad,
          isAuthPage
            ? "w-full p-0"
            : isClientBookingFlow
              ? "flex w-full flex-col items-stretch px-4 py-4 md:py-8"
              : "w-full max-w-full px-4 py-6 md:container md:mx-auto",
        )}
      >
        {children}
      </main>
      {navEligible && <MobileBottomNav docked={dockedChrome} />}
    </div>
  )
}
