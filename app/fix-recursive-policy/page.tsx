"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function FixRecursivePolicy() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleFixPolicy = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/fix-recursive-policy", {
        method: "POST",
      })
      const data = await response.json()
      setResult(data)
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
          <CardTitle>Correggi Policy Ricorsiva</CardTitle>
          <CardDescription>
            Questa pagina ti permette di correggere la policy ricorsiva nella tabella profiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Se stai riscontrando errori di ricorsione infinita nelle policy, clicca il pulsante sotto per correggere il
            problema.
          </p>
          {result && (
            <div
              className={`p-3 rounded-md ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {result.message}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleFixPolicy} disabled={isLoading}>
            {isLoading ? "Correzione in corso..." : "Correggi Policy"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

