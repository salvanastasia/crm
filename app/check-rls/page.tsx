"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@/lib/mock-helpers"

export default function CheckRLSPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [rlsStatus, setRlsStatus] = useState<{ enabled: boolean; policies: any[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const checkRLS = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // SQL per verificare lo stato di RLS sulla tabella profiles
      const rlsCheckSql = `
      SELECT relrowsecurity as rls_enabled
      FROM pg_class
      WHERE oid = 'profiles'::regclass;
      `

      // SQL per ottenere le policy RLS sulla tabella profiles
      const policiesSql = `
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'profiles';
      `

      // Esegui le query SQL
      const { data: rlsData, error: rlsError } = await supabase.rpc("exec_sql", { sql: rlsCheckSql })

      if (rlsError) {
        throw new Error(rlsError.message)
      }

      const { data: policiesData, error: policiesError } = await supabase.rpc("exec_sql", { sql: policiesSql })

      if (policiesError) {
        throw new Error(policiesError.message)
      }

      setRlsStatus({
        enabled: rlsData && rlsData.length > 0 ? rlsData[0].rls_enabled : false,
        policies: policiesData || [],
      })
    } catch (error) {
      console.error("Errore durante la verifica di RLS:", error)
      setError(error instanceof Error ? error.message : "Si è verificato un errore durante la verifica di RLS.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkRLS()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Verifica Stato RLS</CardTitle>
          <CardDescription>
            Questa pagina mostra lo stato attuale di RLS sulla tabella profiles e le policy configurate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Caricamento...</div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Stato RLS</h3>
                {rlsStatus?.enabled ? (
                  <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
                    <AlertDescription>
                      RLS è attualmente <strong>abilitato</strong> sulla tabella profiles.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>
                      RLS è attualmente <strong>disabilitato</strong> sulla tabella profiles.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {rlsStatus?.enabled && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Policy RLS configurate</h3>
                  {rlsStatus.policies.length === 0 ? (
                    <p>Nessuna policy RLS configurata per la tabella profiles.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted">
                            <th className="border p-2 text-left">Nome Policy</th>
                            <th className="border p-2 text-left">Comando</th>
                            <th className="border p-2 text-left">Condizione USING</th>
                            <th className="border p-2 text-left">Condizione WITH CHECK</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rlsStatus.policies.map((policy, index) => (
                            <tr key={index}>
                              <td className="border p-2">{policy.policyname}</td>
                              <td className="border p-2">{policy.cmd}</td>
                              <td className="border p-2">{policy.qual || "N/A"}</td>
                              <td className="border p-2">{policy.with_check || "N/A"}</td>
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
            <Button onClick={checkRLS} disabled={isLoading} variant="outline" className="flex-1">
              {isLoading ? "Verifica in corso..." : "Aggiorna"}
            </Button>
            <Button onClick={() => (window.location.href = "/disable-rls")} className="flex-1">
              Vai a Disabilita RLS
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

