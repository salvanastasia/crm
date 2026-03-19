"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@/lib/mock-helpers"

export default function CreateProfileFunctionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const supabase = createClientComponentClient()

  const createFunction = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // SQL per creare la funzione RPC
      const sql = `
      -- Crea una funzione RPC per ottenere il profilo utente bypassando RLS
      CREATE OR REPLACE FUNCTION public.get_profile_bypass_rls(user_id UUID)
      RETURNS TABLE (
        id UUID,
        name TEXT,
        email TEXT,
        role TEXT,
        phone TEXT
      ) 
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          profiles.id,
          profiles.name,
          profiles.email,
          profiles.role,
          profiles.phone
        FROM profiles
        WHERE profiles.id = user_id
        LIMIT 1;
      END;
      $$;

      -- Concedi i permessi necessari
      GRANT EXECUTE ON FUNCTION public.get_profile_bypass_rls(UUID) TO authenticated;
      GRANT EXECUTE ON FUNCTION public.get_profile_bypass_rls(UUID) TO anon;
      GRANT EXECUTE ON FUNCTION public.get_profile_bypass_rls(UUID) TO service_role;
      `

      // Esegui lo script SQL
      const { error } = await supabase.rpc("exec_sql", { sql })

      if (error) {
        throw new Error(error.message)
      }

      setResult({
        success: true,
        message:
          "Funzione RPC creata con successo! Ora puoi utilizzare get_profile_bypass_rls per ottenere il profilo utente.",
      })
    } catch (error) {
      console.error("Errore durante la creazione della funzione RPC:", error)
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Si è verificato un errore durante la creazione della funzione RPC.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Crea Funzione RPC per Profili</CardTitle>
          <CardDescription>
            Questo strumento creerà una funzione RPC che permette di ottenere il profilo utente bypassando RLS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <p>Questo script eseguirà le seguenti operazioni:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Creare una funzione RPC <code>get_profile_bypass_rls</code> che ottiene il profilo utente bypassando RLS
              </li>
              <li>Concedere i permessi necessari per eseguire la funzione</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Nota: Questa funzione è necessaria per risolvere i problemi di autenticazione causati dalle policy RLS.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={createFunction} disabled={isLoading} className="w-full">
            {isLoading ? "Creazione in corso..." : "Crea Funzione RPC"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

