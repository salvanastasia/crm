"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/mock-helpers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true)

        // Controlla la sessione
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        // Se c'è una sessione, ottieni l'utente
        if (sessionData.session) {
          const { data: userData, error: userError } = await supabase.auth.getUser()

          if (userError) {
            throw userError
          }

          setAuthState({
            session: sessionData.session,
            user: userData.user,
          })

          // Prova a ottenere il profilo
          if (userData.user) {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userData.user.id)
              .single()

            if (profileError) {
              console.error("Errore nel recupero del profilo:", profileError)
            } else {
              setProfileData(profile)
            }
          }
        } else {
          setAuthState({ session: null, user: null })
        }
      } catch (err: any) {
        console.error("Errore durante il controllo dell'autenticazione:", err)
        setError(err.message || "Si è verificato un errore durante il controllo dell'autenticazione")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Debug Autenticazione</CardTitle>
          <CardDescription>Questa pagina mostra lo stato attuale dell'autenticazione</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Caricamento...</div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Stato Sessione</h3>
                <div className="mt-2 p-4 bg-gray-100 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm">
                    {authState?.session ? "Autenticato" : "Non autenticato"}
                  </pre>
                </div>
              </div>

              {authState?.user && (
                <div>
                  <h3 className="text-lg font-medium">Dati Utente</h3>
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

              {profileData && (
                <div>
                  <h3 className="text-lg font-medium">Dati Profilo</h3>
                  <div className="mt-2 p-4 bg-gray-100 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(profileData, null, 2)}</pre>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Aggiorna
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

