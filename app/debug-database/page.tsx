"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@/lib/mock-helpers"

export default function DebugDatabasePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [tableExists, setTableExists] = useState(false)
  const [tableData, setTableData] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const checkDatabase = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Verifica se la tabella business_settings esiste
      const { data: tableInfo, error: tableError } = await supabase.from("business_settings").select("*").limit(1)

      if (tableError && tableError.code === "42P01") {
        // La tabella non esiste
        setTableExists(false)
        setTableData(null)
        return
      } else if (tableError) {
        throw new Error(tableError.message)
      }

      setTableExists(true)

      // Ottieni tutti i dati dalla tabella
      const { data, error: dataError } = await supabase.from("business_settings").select("*")

      if (dataError) {
        throw new Error(dataError.message)
      }

      setTableData(data)
    } catch (error) {
      console.error("Errore durante il controllo del database:", error)
      setError(error instanceof Error ? error.message : "Si è verificato un errore durante il controllo del database.")
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
          <CardTitle>Debug Database</CardTitle>
          <CardDescription>Verifica lo stato della tabella business_settings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Caricamento...</div>
          ) : error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Stato della tabella</h3>
                {tableExists ? (
                  <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>La tabella business_settings esiste nel database.</AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      La tabella business_settings non esiste nel database. Vai alla pagina di inizializzazione per
                      crearla.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {tableExists && tableData && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Dati nella tabella</h3>
                  {tableData.length === 0 ? (
                    <p>La tabella è vuota. Vai alla pagina di inizializzazione per inserire dati di esempio.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted">
                            <th className="border p-2 text-left">ID</th>
                            <th className="border p-2 text-left">Nome Attività</th>
                            <th className="border p-2 text-left">Colore Brand</th>
                            <th className="border p-2 text-left">Logo URL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.map((row) => (
                            <tr key={row.id}>
                              <td className="border p-2">{row.id}</td>
                              <td className="border p-2">{row.business_name}</td>
                              <td className="border p-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: row.brand_color || "#4f46e5" }}
                                  />
                                  {row.brand_color || "#4f46e5"}
                                </div>
                              </td>
                              <td className="border p-2">{row.logo_url || "Nessun logo"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex gap-4 w-full">
            <Button onClick={checkDatabase} disabled={isLoading} variant="outline" className="flex-1">
              {isLoading ? "Controllo in corso..." : "Aggiorna"}
            </Button>
            <Button onClick={() => (window.location.href = "/init-database")} className="flex-1">
              Vai a Inizializza Database
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

