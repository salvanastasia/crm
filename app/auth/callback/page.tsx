"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { syncProfileFromAuthUser } from "@/lib/profile-sync"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("Conferma in corso...")

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setMessage("Config Supabase mancante.")
        return
      }
      const code = searchParams.get("code")
      const tokenHash = searchParams.get("token_hash")
      const type = searchParams.get("type")
      const nextParam = searchParams.get("next")
      const defaultNext = "/"

      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        } else if (tokenHash && type) {
          await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "email" | "recovery" | "invite" | "email_change",
          })
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          setMessage("Link non valido o scaduto. Richiedi un nuovo link.")
          return
        }

        let pendingRole: "admin" | "client" | undefined
        if (typeof window !== "undefined") {
          const raw = sessionStorage.getItem("barber_crm_signup_role")
          if (raw === "admin" || raw === "client") {
            pendingRole = raw
            sessionStorage.removeItem("barber_crm_signup_role")
          }
        }

        const user = await syncProfileFromAuthUser(supabase, session.user, {
          pendingRole,
        })
        if (!user) {
          setMessage("Impossibile sincronizzare il profilo. Riprova.")
          return
        }

        let next = nextParam || defaultNext
        if (next !== "/" && !next.startsWith("/")) {
          next = defaultNext
        }
        if (user.role === "client") {
          next = "/booking"
        } else if (user.role === "admin" && !user.barberId) {
          next = "/onboarding"
        } else if (user.role === "admin" || user.role === "staff") {
          next = "/"
        }

        router.replace(next)
      } catch (error) {
        console.error("Errore callback auth:", error)
        setMessage("Errore durante la conferma. Riprova.")
      }
    }

    void handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-sm text-muted-foreground">Conferma in corso...</div>}>
      <AuthCallbackContent />
    </Suspense>
  )
}
