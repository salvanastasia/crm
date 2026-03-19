"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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
      const next = searchParams.get("next") || "/"

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

        const fallbackName =
          (session.user.user_metadata?.name as string | undefined) ||
          searchParams.get("name") ||
          (session.user.email ? session.user.email.split("@")[0] : "Utente")

        await supabase.from("profiles").upsert(
          {
            id: session.user.id,
            email: session.user.email ?? "",
            name: fallbackName,
            role: "client",
          },
          { onConflict: "id" },
        )

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
