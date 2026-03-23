"use client"

/**
 * Multi-shop “trova salone” — UI disattivata (single-business).
 * La logica multi-salone resta in @/lib/barber (`getBarbers`, `associateClientWithBarber`).
 * Questa route reindirizza e riprova solo l’auto-link al salone di default.
 */
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { linkClientToDefaultSalonIfNeeded } from "@/lib/link-default-salon"

export default function FindBarberPage() {
  const { user, isAuthenticated, isLoading, refreshProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }
    if (user?.role !== "client") {
      router.replace("/dashboard")
      return
    }

    ;(async () => {
      const supabase = getSupabaseBrowserClient()
      if (supabase && user.id && !user.barberId) {
        await linkClientToDefaultSalonIfNeeded(supabase, user.id, "client", undefined)
        await refreshProfile()
      }
      router.replace("/booking")
    })()
  }, [isLoading, isAuthenticated, user, router, refreshProfile])

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Reindirizzamento…
    </div>
  )
}
