"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@/lib/mock-helpers"

export default function DebugAndFixPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [authState, setAuthState] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState<{ success: boolean; message: string } | null>(null)
  const supabase = createClientComponentClient()

  const checkAuth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Verifica la sessione
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (!sessionData.session) {
        setAuthState({ session: null, user: null, profile: null })
        return
      }

      // Ottieni l'utente
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      // Ottieni il profilo direttamente
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single()

      setAuthState({
        session: sessionData.session,
        user: userData.user,
        profile: profileError ? null : profileData,
        profileError: profileError ? profileError.message : null,
      })
    } catch (err) {
      console.error("Errore durante il controllo dell'autenticazione:", err)
      setError(err instanceof Error ? err.message : "Errore durante il controllo dell'autenticazione")
    } finally {
      setIsLoading(false)
    }
  }

  const disableRLS = async () => {
    setIsFixing(true)
    setFixResult(null)

    try {
      // SQL per disabilitare RLS sulla tabella profiles
      const sql = `
      -- Disabilita RLS sulla tabella profiles
      ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
      `

      // Esegui lo script SQL
      const { error } = await supabase.rpc("exec_sql", { sql })

      if (error) {
        throw new Error(error.message)
      }

      setFixResult({
        success: true,
        message:
          "RLS è stato disabilitato con successo sulla tabella profiles. Ora tutti gli utenti possono accedere a tutti i profili.",
      })

      // Aggiorna lo stato dell'autenticazione
      await checkAuth()
    } catch (error) {
      console.error("Errore durante la disabilitazione di RLS:", error)
      setFixResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Si è verificato un errore durante la disabilitazione di RLS.",
      })
    } finally {
      setIsFixing(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Debug e Risoluzione Problemi</CardTitle>
          <CardDescription>
            Questa pagina mostra lo stato attuale dell'autenticazione e permette di risolvere i problemi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Caricamento...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Stato Sessione</h3>
                <div className="mt-2 p-4 bg-gray-100 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm">
                    {authState?.session ? "Autenticato" : "Non autenticato"}
                  </pre>
                </div>
              </div>

              {authState?.user && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Dati Utente</h3>
                  <div className="mt-2 p-4 bg-gray-100 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(
                        {
                          id: authState.user.id,
                          email: authState.user.email,
                          emailConfirmed: authState.user.email_confirmed_at,
                          lastSignIn: authState.user.last_sign_in_at,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {authState?.profile ? (
                <div>
                  <h3 className="text-lg font-medium mb-2">Dati Profilo</h3>
                  <div className="mt-2 p-4 bg-gray-100 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(authState.profile, null, 2)}</pre>
                  </div>
                </div>
              ) : authState?.profileError ? (
                <div>
                  <h3 className="text-lg font-medium mb-2">Errore Profilo</h3>
                  <Alert variant="destructive">
                    <AlertDescription>{authState.profileError}</AlertDescription>
                  </Alert>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      L'errore sopra indica un problema con le policy RLS. Puoi disabilitare RLS per risolvere il
                      problema:
                    </p>
                    <Button onClick={disableRLS} disabled={isFixing} className="bg-amber-600 hover:bg-amber-700">
                      {isFixing ? "Disabilitazione in corso..." : "Disabilita RLS"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {fixResult && (
                <Alert variant={fixResult.success ? "default" : "destructive"} className="mt-4">
                  <AlertDescription>{fixResult.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex gap-4 w-full">
            <Button onClick={checkAuth} disabled={isLoading} variant="outline" className="flex-1">
              {isLoading ? "Verifica in corso..." : "Aggiorna"}
            </Button>
            <Button onClick={() => (window.location.href = "/login")} className="flex-1">
              Vai al Login
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

