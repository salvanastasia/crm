"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/mock-helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccessMessage(
        "Ti abbiamo inviato un'email con le istruzioni per reimpostare la password. Controlla la tua casella di posta.",
      )
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Invio in corso..." : "Invia link di recupero"}
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

