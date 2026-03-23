"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const messageFromQuery = searchParams.get("message")
  const { loginWithPassword, isAuthenticated, isLoading: authLoading, user } = useAuth()
  const router = useRouter()

  // Mostra il messaggio di ritorno (es. dopo update password).
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Accedi</CardTitle>
          <CardDescription>Email e password, oppure richiedi un link via email</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="password" className="mt-4">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/reset-password" className="text-sm text-primary hover:underline">
                      Password dimenticata?
                    </Link>
                  </div>
                  <Input
                    id="password"
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
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="text-sm text-center text-muted-foreground">
            Non hai un account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Registrati
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

