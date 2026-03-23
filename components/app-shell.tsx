"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Header } from "@/components/header"
import { useAuth } from "@/components/auth-context"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const isClientBookingFlow = user?.role === "client" && pathname.startsWith("/booking")
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  const shouldShowHeader = !isAuthPage

  return (
    <div className="min-h-screen flex flex-col">
      {shouldShowHeader && <Header />}
      <main
        className={cn(
          "flex-1",
          isAuthPage
            ? "w-full p-0"
            : isClientBookingFlow
              ? "px-4 py-4 md:py-8 w-full flex flex-col items-stretch"
              : "container mx-auto px-4 py-6",
        )}
      >
        {children}
      </main>
    </div>
  )
}
