"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowserClient()

  // Token dalla URL (Supabase può usare `token` o `token_hash`)
  const token = searchParams.get("token")
  const tokenHash = searchParams.get("token_hash")
  const tokenCandidate = token ?? tokenHash

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Verifica che le password corrispondano
    if (password !== confirmPassword) {
      setError("Le password non corrispondono")
      setIsLoading(false)
      return
    }

    try {
      if (!supabase) {
        setError("Config Supabase mancante")
        return
      }

      if (!tokenCandidate) {
        // Fallback: nei recovery link Supabase può instaurare una sessione
        // direttamente dall'URL (es. con access_token). Proviamo `updateUser`
        // senza `verifyOtp`.
        const { error } = await supabase.auth.updateUser({
          password: password,
        })

        if (error) {
          setError(error.message ?? "Link di recupero non valido o scaduto.")
          return
        }

        router.push("/login?message=Password aggiornata con successo")
        return
      }

      // Prima valida il token (deterministico) per il flusso recovery.
      const verifyPayload: any = { type: "recovery" }
      if (token) verifyPayload.token = token
      else verifyPayload.token_hash = tokenHash

      const { error: verifyErr } = await (supabase.auth as any).verifyOtp(verifyPayload)
      if (verifyErr) {
        setError(verifyErr.message ?? "Token non valido o scaduto.")
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        console.error("Errore durante l'aggiornamento:", error)
        setError(error.message)
        return
      }

      // Reindirizza alla pagina di login
      router.push("/login?message=Password aggiornata con successo")
    } catch (err) {
      console.error("Errore durante l'aggiornamento della password:", err)
      setError("Si è verificato un errore durante l'aggiornamento della password. Riprova più tardi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nuova password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Conferma password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Aggiornamento in corso..." : "Aggiorna password"}
        </Button>
      </form>
    </div>
  )
}

