"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ApiStatusPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<{ success: boolean; message: string } | null>(null)

  const checkApi = async () => {
    setIsLoading(true)
    setApiStatus(null)

    try {
      // Verifica l'API get-profile
      const response = await fetch("/api/get-profile")

      if (response.ok) {
        const data = await response.json()
        setApiStatus({
          success: true,
          message: `API funzionante. Risposta: ${JSON.stringify(data)}`,
        })
      } else {
        const errorData = await response.json()
        setApiStatus({
          success: false,
          message: `Errore API: ${response.status} - ${errorData.error || "Errore sconosciuto"}`,
        })
      }
    } catch (error) {
      console.error("Errore durante la verifica dell'API:", error)
      setApiStatus({
        success: false,
        message: error instanceof Error ? error.message : "Errore durante la verifica dell'API",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkApi()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Stato API</CardTitle>
          <CardDescription>Questa pagina verifica lo stato delle API necessarie per l'autenticazione.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Verifica in corso...</div>
          ) : apiStatus ? (
            <Alert variant={apiStatus.success ? "default" : "destructive"} className="mb-4">
              <AlertDescription>{apiStatus.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button onClick={checkApi} disabled={isLoading} className="w-full">
            {isLoading ? "Verifica in corso..." : "Verifica API"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

