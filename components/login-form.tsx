"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const messageFromQuery = searchParams.get("message")
  const { loginWithPassword, isAuthenticated, isLoading: authLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (messageFromQuery) setSuccess(messageFromQuery)
  }, [messageFromQuery])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return

    if (user.role === "client") {
      router.replace("/booking")
      return
    }

    if (user.role === "admin" && !user.barberId) {
      router.replace("/onboarding")
      return
    }

    router.replace("/dashboard")
  }, [authLoading, isAuthenticated, router, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await loginWithPassword(email, password)

      if (result.success) {
        setSuccess(result.message)
      } else {
        setError(result.message)
      }
    } catch {
      setError("Si è verificato un errore durante l'accesso")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Accedi</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Inserisci email e password per accedere al tuo account
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
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="nome@esempio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="login-password">Password</Label>
            <Link href="/reset-password" className="text-sm text-primary underline-offset-4 hover:underline">
              Password dimenticata?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Accesso in corso..." : "Accedi"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Non hai un account?{" "}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
          Registrati
        </Link>
      </p>
    </div>
  )
}
