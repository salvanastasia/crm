"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("Conferma in corso...")
  const didRunRef = useRef(false)

  useEffect(() => {
    if (didRunRef.current) return
    didRunRef.current = true

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
      const errorParam = searchParams.get("error")
      const errorCode = searchParams.get("error_code")
      const errorDescription = searchParams.get("error_description")

      try {
        if (errorParam) {
          setMessage(`Link non valido: ${errorParam}${errorCode ? ` (${errorCode})` : ""}${errorDescription ? ` - ${errorDescription}` : ""}`)
          return
        }

        let session: any = null
        if (code) {
          const exchangeRes = await supabase.auth.exchangeCodeForSession(code)
          session = exchangeRes?.data?.session ?? null
        } else if (tokenHash && type) {
          const verifyRes = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "email" | "recovery" | "invite" | "email_change" | "signup",
          })
          session = verifyRes?.data?.session ?? null
        }

        if (!session?.user) {
          setMessage("Link non valido o scaduto. Richiedi un nuovo link.")
          return
        }

        const roleFromMetadata = session.user?.user_metadata?.role as string | undefined

        let next = nextParam || defaultNext
        if (next !== "/" && !next.startsWith("/")) {
          next = defaultNext
        }
        // Only apply role-based redirect when caller didn't provide an explicit `next`.
        if (!nextParam && roleFromMetadata === "client") next = "/booking"

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
