"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreateTestUsersPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleCreateUsers = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/create-test-user")
      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message:
            "Utenti di test creati con successo! Puoi ora accedere con:\n\nAdmin: admin@barbercrm.com / Admin123!\nCliente: cliente@example.com / Cliente123!",
        })
      } else {
        setResult({
          success: false,
          message: `Errore: ${data.error || "Si è verificato un errore durante la creazione degli utenti"}`,
        })
      }
    } catch (error) {
      console.error("Errore:", error)
      setResult({
        success: false,
        message: "Si è verificato un errore durante la richiesta",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Crea Utenti di Test</CardTitle>
          <CardDescription>Crea un utente admin e un utente cliente per testare l'applicazione</CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              <AlertDescription className="whitespace-pre-line">{result.message}</AlertDescription>
            </Alert>
          )}
          <p className="mb-4">Questa azione creerà due utenti di test:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>
              <strong>Admin:</strong> admin@barbercrm.com / Admin123!
            </li>
            <li>
              <strong>Cliente:</strong> cliente@example.com / Cliente123!
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateUsers} disabled={isLoading} className="w-full">
            {isLoading ? "Creazione in corso..." : "Crea Utenti di Test"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

