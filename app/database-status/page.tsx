"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DatabaseStatusPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkDatabase = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/check-database")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Errore ${response.status}`)
      }

      const data = await response.json()
      setDbStatus(data)
    } catch (error) {
      console.error("Errore durante la verifica del database:", error)
      setError(error instanceof Error ? error.message : "Errore durante la verifica del database")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkDatabase()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Stato Database</CardTitle>
          <CardDescription>Questa pagina verifica lo stato del database e delle tabelle necessarie.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Verifica in corso...</div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : dbStatus ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Stato Generale</h3>
                <Alert variant={dbStatus.success ? "default" : "destructive"} className="mb-4">
                  <AlertDescription>{dbStatus.success ? "Database funzionante" : dbStatus.message}</AlertDescription>
                </Alert>
              </div>

              {dbStatus.success && (
                <>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Tabella Profiles</h3>
                    <Alert variant={dbStatus.profiles.exists ? "default" : "destructive"} className="mb-4">
                      <AlertDescription>
                        {dbStatus.profiles.exists
                          ? `La tabella profiles esiste (${dbStatus.profiles.count} record)`
                          : "La tabella profiles non esiste"}
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Tabella Business Settings</h3>
                    <Alert variant={dbStatus.settings.exists ? "default" : "destructive"} className="mb-4">
                      <AlertDescription>
                        {dbStatus.settings.exists
                          ? `La tabella business_settings esiste (${dbStatus.settings.count} record)`
                          : "La tabella business_settings non esiste"}
                      </AlertDescription>
                    </Alert>
                  </div>

                  {dbStatus.rls.checked && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Stato RLS</h3>
                      <Alert variant={dbStatus.rls.enabled ? "default" : "default"} className="mb-4">
                        <AlertDescription>
                          RLS è {dbStatus.rls.enabled ? "abilitato" : "disabilitato"} sulla tabella profiles
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}
        </CardContent>
        <CardFooter>
          <div className="flex gap-4 w-full">
            <Button onClick={checkDatabase} disabled={isLoading} className="flex-1">
              {isLoading ? "Verifica in corso..." : "Verifica Database"}
            </Button>
            <Button onClick={() => (window.location.href = "/disable-rls")} variant="outline" className="flex-1">
              Vai a Gestione RLS
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

