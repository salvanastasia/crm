"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"

const MIN_PASSWORD_LEN = 6

export function SignupForm({ className }: { className?: string }) {
  const { register } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

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
        setSuccess(result.message)
      } else {
        setError(result.message)
      }
    } catch {
      setError("Si è verificato un errore durante la registrazione")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Crea un account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Compila i campi per registrarti; se richiesto, conferma l&apos;email prima di accedere.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40">
          <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-3">
          <Label htmlFor="signup-name">Nome e cognome</Label>
          <Input
            id="signup-name"
            placeholder="Mario Rossi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="nome@esempio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LEN}
              className="pr-10"
            />
            <button
              type="button"
              aria-label={showPassword ? "Nascondi password" : "Mostra password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="signup-confirm">Conferma password</Label>
          <div className="relative">
            <Input
              id="signup-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LEN}
              className="pr-10"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Nascondi password" : "Mostra password"}
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Registrazione in corso..." : "Crea account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Hai già un account?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Accedi
        </Link>
      </p>
    </div>
  )
}
