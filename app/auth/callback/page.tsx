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
      // Avoid failing the callback just because the exchange is slow.
      // We only log after `ms`, but we still await the real promise.
      const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
        let t: any
        t = setTimeout(() => {
          fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'dd094c' },
            body: JSON.stringify({
              sessionId: 'dd094c',
              runId: 'auth-callback',
              hypothesisId: 'M',
              location: 'app/auth/callback/page.tsx',
              message: 'auth-callback:slow',
              data: { ms },
              timestamp: Date.now(),
            }),
          }).catch(() => {})
        }, ms)

        try {
          return await p
        } finally {
          clearTimeout(t)
        }
      }

      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'auth-callback',hypothesisId:'M',location:'app/auth/callback/page.tsx',message:'auth-callback:start',data:{hasCode:!!searchParams.get("code"),hasTokenHash:!!searchParams.get("token_hash"),type:searchParams.get("type"),next:searchParams.get("next")},timestamp:Date.now()})}).catch(()=>{})
      // #endregion

      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setMessage("Config Supabase mancante.")
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'auth-callback',hypothesisId:'M',location:'app/auth/callback/page.tsx',message:'auth-callback:no-supabase',data:{},timestamp:Date.now()})}).catch(()=>{})
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
          // #region agent log
          fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'auth-callback',hypothesisId:'M',location:'app/auth/callback/page.tsx',message:'auth-callback:received-error-param',data:{errorParam,errorCode,errorDescription},timestamp:Date.now()})}).catch(()=>{})
          // #endregion
          return
        }

        let session: any = null
        if (code) {
          // #region agent log
          fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'auth-callback',hypothesisId:'M',location:'app/auth/callback/page.tsx',message:'auth-callback:exchangeCodeForSession:start',data:{},timestamp:Date.now()})}).catch(()=>{})
          // #endregion
          const exchangeRes = await withTimeout(supabase.auth.exchangeCodeForSession(code), 10000)
          session = exchangeRes?.data?.session ?? null
          // #region agent log
          fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'auth-callback',hypothesisId:'M',location:'app/auth/callback/page.tsx',message:'auth-callback:exchangeCodeForSession:done',data:{},timestamp:Date.now()})}).catch(()=>{})
          // #endregion
        } else if (tokenHash && type) {
          // #region agent log
          fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'auth-callback',hypothesisId:'M',location:'app/auth/callback/page.tsx',message:'auth-callback:verifyOtp:start',data:{type},timestamp:Date.now()})}).catch(()=>{})
          // #endregion
          const verifyRes = await withTimeout(
            supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type as "email" | "recovery" | "invite" | "email_change" | "signup",
            }),
            10000,
          )
          session = verifyRes?.data?.session ?? null
          // #region agent log
          fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'auth-callback',hypothesisId:'M',location:'app/auth/callback/page.tsx',message:'auth-callback:verifyOtp:done',data:{type},timestamp:Date.now()})}).catch(()=>{})
          // #endregion
        }

        if (!session?.user) {
          setMessage("Link non valido o scaduto. Richiedi un nuovo link.")
          // #region agent log
          fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'auth-callback',hypothesisId:'M',location:'app/auth/callback/page.tsx',message:'auth-callback:no-session-user',data:{hasSession:!!session},timestamp:Date.now()})}).catch(()=>{})
          // #endregion
          return
        }

        const roleFromMetadata = session.user?.user_metadata?.role as string | undefined

        let next = nextParam || defaultNext
        if (next !== "/" && !next.startsWith("/")) {
          next = defaultNext
        }
        // Only apply role-based redirect when caller didn't provide an explicit `next`.
        if (!nextParam && roleFromMetadata === "client") next = "/booking"

        // #region agent log
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'auth-callback',hypothesisId:'M',location:'app/auth/callback/page.tsx',message:'auth-callback:router.replace',data:{next,role:roleFromMetadata},timestamp:Date.now()})}).catch(()=>{})
        // #endregion

        router.replace(next)
      } catch (error) {
        console.error("Errore callback auth:", error)
        setMessage("Errore durante la conferma. Riprova.")
        // #region agent log
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'auth-callback',hypothesisId:'M',location:'app/auth/callback/page.tsx',message:'auth-callback:error',data:{errorMessage:(error as any)?.message??null},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
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
