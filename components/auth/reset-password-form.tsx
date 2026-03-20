"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const supabase = getSupabaseBrowserClient()

  const getCooldownSecondsLeft = () => {
    if (!cooldownUntil) return 0
    const msLeft = cooldownUntil - Date.now()
    return msLeft > 0 ? Math.ceil(msLeft / 1000) : 0
  }

  const parseWaitSecondsFromError = (message: string): number | null => {
    // Esempi:
    // "For security purposes, you can only request this after 10 seconds."
    // "For security purposes, you can only request this after 29 seconds."
    const m = message.match(/after\s+(\d+)\s+second/i)
    if (!m) return null
    const n = Number(m[1])
    return Number.isFinite(n) ? n : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const secondsLeft = getCooldownSecondsLeft()
    if (secondsLeft > 0) {
      setError(`Riprova tra ${secondsLeft} secondi (richieste troppo ravvicinate).`)
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (!supabase) {
        setError("Config Supabase mancante")
        return
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        const waitSeconds = parseWaitSecondsFromError(error.message)
        if (waitSeconds != null) {
          setCooldownUntil(Date.now() + waitSeconds * 1000)
          setError(`Hai effettuato richieste troppo ravvicinate. Attendi ${waitSeconds} secondi e riprova.`)
        } else {
          setError(error.message)
        }
        return
      }

      setSuccessMessage(
        "Ti abbiamo inviato un'email con le istruzioni per reimpostare la password. Controlla la tua casella di posta e lo spam.",
      )

      // Anti-spam UX: evita click ripetuti che spesso vengono rate-limitati da Supabase.
      setCooldownUntil(Date.now() + 15 * 1000)
    } catch (err) {
      console.error("Errore durante il reset della password:", err)
      setError("Si è verificato un errore durante l'invio dell'email di recupero. Riprova più tardi.")
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
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nome@esempio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || getCooldownSecondsLeft() > 0}
        >
          {isLoading
            ? "Invio in corso..."
            : getCooldownSecondsLeft() > 0
              ? `Attendi ${getCooldownSecondsLeft()}s...`
              : "Invia link di recupero"}
        </Button>
      </form>
      <div className="text-center text-sm">
        Ricordi la password?{" "}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-800">
          Torna al login
        </Link>
      </div>
    </div>
  )
}

