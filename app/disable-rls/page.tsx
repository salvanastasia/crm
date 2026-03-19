"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@/lib/mock-helpers"

export default function DisableRLSPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const supabase = createClientComponentClient()

  const disableRLS = async () => {
    setIsLoading(true)
    setResult(null)

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

      setResult({
        success: true,
        message:
          "RLS è stato disabilitato con successo sulla tabella profiles. Ora tutti gli utenti possono accedere a tutti i profili.",
      })
    } catch (error) {
      console.error("Errore durante la disabilitazione di RLS:", error)
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Si è verificato un errore durante la disabilitazione di RLS.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Disabilita RLS per Profiles</CardTitle>
          <CardDescription>
            Questo strumento disabiliterà completamente RLS sulla tabella profiles. Usa questa opzione solo se le altre
            soluzioni non funzionano.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <p className="font-bold text-amber-600">Attenzione: Questa è una misura estrema!</p>
            <p>Disabilitare RLS significa che:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Tutti gli utenti autenticati potranno leggere e modificare tutti i profili</li>
              <li>Non ci sarà più alcuna protezione a livello di riga per i dati dei profili</li>
              <li>Questa è una soluzione temporanea finché non risolvi i problemi con le policy RLS</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Nota: In un ambiente di produzione, dovresti risolvere i problemi con le policy RLS invece di
              disabilitarle completamente.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={disableRLS} disabled={isLoading} className="w-full bg-amber-600 hover:bg-amber-700">
            {isLoading ? "Disabilitazione in corso..." : "Disabilita RLS"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

