"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function FixProfilesPolicy() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFixPolicy = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/fix-profiles-policy", {
        method: "POST",
      })

      const data = await response.json()
      setResult({
        success: response.ok,
        message:
          data.message || (response.ok ? "Policy corretta con successo" : "Errore durante la correzione della policy"),
      })
    } catch (error) {
      console.error("Errore durante la correzione della policy:", error)
      setResult({
        success: false,
        message: "Si è verificato un errore durante la correzione della policy",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Correzione Policy Profiles</CardTitle>
          <CardDescription>
            Questa pagina corregge la policy RLS sulla tabella "profiles" che causa ricorsione infinita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Se stai riscontrando l'errore "infinite recursion detected in policy for relation profiles", questo
            strumento può aiutarti a risolvere il problema.
          </p>
          {result && (
            <Alert className={result.success ? "bg-green-50" : "bg-red-50"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>{result.success ? "Successo" : "Errore"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleFixPolicy} disabled={isLoading} className="w-full">
            {isLoading ? "Correzione in corso..." : "Correggi Policy"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

