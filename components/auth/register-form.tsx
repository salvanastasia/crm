"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-context"

const MIN_PASSWORD_LEN = 6

export function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { addToast } = useToast()
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

  const handleSocialSignup = async (provider: "google" | "apple") => {
    try {
      if (!supabase) {
        setError("Config Supabase mancante")
        return
      }

      setSocialLoading(provider)
      setError(null)

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        addToast({
          title: "Errore di autenticazione",
          description: oauthError.message,
          type: "error",
        })
      }
    } catch (err) {
      console.error(`Errore durante la registrazione con ${provider}:`, err)
      setError(`Si è verificato un errore durante la registrazione con ${provider}. Riprova più tardi.`)
    } finally {
      setSocialLoading(null)
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

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-50 px-2 text-gray-500">Oppure continua con</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" type="button" disabled={!!socialLoading} onClick={() => handleSocialSignup("google")}>
          {socialLoading === "google" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Google
        </Button>
        <Button variant="outline" type="button" disabled={!!socialLoading} onClick={() => handleSocialSignup("apple")}>
          {socialLoading === "apple" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 mr-2">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
            </svg>
          )}
          Apple
        </Button>
      </div>

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
