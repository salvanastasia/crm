"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth-context"

const MIN_PASSWORD_LEN = 6

export function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    if (password.length < MIN_PASSWORD_LEN) {
      setError(`La password deve avere almeno ${MIN_PASSWORD_LEN} caratteri.`)
      setIsLoading(false)
      return
    }
    if (password !== confirmPassword) {
      setError("Le password non coincidono.")
      setIsLoading(false)
      return
    }

    try {
      const result = await register(name, email, password)

      if (result.success) {
        setSuccessMessage(result.message)
        if (result.pendingConfirmation) {
          setTimeout(() => router.push("/login"), 2500)
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error("Errore durante la registrazione:", err)
      setError("Si è verificato un errore durante la registrazione. Riprova più tardi.")
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
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            type="text"
            placeholder="Mario Rossi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nome@esempio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LEN}
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
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LEN}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Registrazione in corso..." : "Crea account"}
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm text-gray-600">
        <div>
          Hai già un account?{" "}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-800">
            Accedi
          </Link>
        </div>
        <div>
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-800">
            Registrazione nella app
          </Link>
        </div>
      </div>
    </div>
  )
}
