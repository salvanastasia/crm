"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@/lib/mock-helpers"

export default function CheckRpcFunctionPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [functionExists, setFunctionExists] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const checkFunction = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // SQL per verificare se la funzione RPC esiste
      const sql = `
      SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'get_profile_bypass_rls'
      );
      `

      // Esegui lo script SQL
      const { data, error } = await supabase.rpc("exec_sql", { sql })

      if (error) {
        throw new Error(error.message)
      }

      setFunctionExists(data && data.length > 0 && data[0].exists)
    } catch (error) {
      console.error("Errore durante la verifica della funzione RPC:", error)
      setError(
        error instanceof Error ? error.message : "Si è verificato un errore durante la verifica della funzione RPC.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkFunction()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Verifica Funzione RPC</CardTitle>
          <CardDescription>
            Questa pagina verifica se la funzione RPC necessaria per l'autenticazione esiste.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Verifica in corso...</div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Alert variant={functionExists ? "default" : "destructive"}>
              <AlertDescription>
                {functionExists
                  ? "La funzione RPC get_profile_bypass_rls esiste."
                  : "La funzione RPC get_profile_bypass_rls non esiste. Vai alla pagina di creazione per crearla."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex gap-4 w-full">
            <Button onClick={checkFunction} disabled={isLoading} variant="outline" className="flex-1">
              {isLoading ? "Verifica in corso..." : "Aggiorna"}
            </Button>
            <Button
              onClick={() => (window.location.href = "/create-profile-function")}
              className="flex-1"
              disabled={functionExists}
            >
              {functionExists ? "Funzione già esistente" : "Crea Funzione RPC"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

