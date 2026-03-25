"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-context"
import { useIsCapacitorNative } from "@/hooks/use-is-capacitor-native"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { CapacitorDeepLinkBridge } from "@/components/capacitor-deep-link-bridge"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const { user, isAuthenticated, isLoading } = useAuth()
  const isCapacitorNative = useIsCapacitorNative()

  const isClientBookingFlow = user?.role === "client" && pathname.startsWith("/booking")
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/update-password")

  const shouldShowHeader = !isAuthPage

  const showMobileBottom =
    isCapacitorNative &&
    !isLoading &&
    isAuthenticated &&
    !isAuthPage &&
    user != null &&
    (user.role === "admin" || user.role === "staff" || user.role === "client")

  const mainBottomPad = showMobileBottom
    ? "pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]"
    : ""

  return (
    <div className="min-h-screen flex flex-col">
      {isCapacitorNative && <CapacitorDeepLinkBridge />}
      {shouldShowHeader && <Header />}
      <main
        className={cn(
          "flex-1",
          mainBottomPad,
          isAuthPage
            ? "w-full p-0"
            : isClientBookingFlow
              ? "px-4 py-4 md:py-8 w-full flex flex-col items-stretch"
              : "container mx-auto px-4 py-6",
        )}
      >
        {children}
      </main>
      {showMobileBottom && <MobileBottomNav />}
    </div>
  )
}
