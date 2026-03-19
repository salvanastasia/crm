"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@/lib/mock-helpers"

export default function AutoCreateFunctionPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const createFunction = async () => {
      try {
        // SQL per verificare se la funzione RPC esiste
        const checkSql = `
        SELECT EXISTS (
          SELECT 1 
          FROM pg_proc 
          WHERE proname = 'get_profile_bypass_rls'
        );
        `

        // Esegui lo script SQL
        const { data: checkData, error: checkError } = await supabase.rpc("exec_sql", { sql: checkSql })

        if (checkError) {
          throw new Error(checkError.message)
        }

        const functionExists = checkData && checkData.length > 0 && checkData[0].exists

        if (functionExists) {
          setResult({
            success: true,
            message: "La funzione RPC get_profile_bypass_rls esiste già.",
          })
          return
        }

        // SQL per creare la funzione RPC
        const createSql = `
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
        const { error: createError } = await supabase.rpc("exec_sql", { sql: createSql })

        if (createError) {
          throw new Error(createError.message)
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
            error instanceof Error
              ? error.message
              : "Si è verificato un errore durante la creazione della funzione RPC.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    createFunction()
  }, [supabase])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Creazione Automatica Funzione RPC</CardTitle>
          <CardDescription>
            Questa pagina crea automaticamente la funzione RPC necessaria per l'autenticazione.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Creazione funzione RPC in corso...</p>
            </div>
          ) : result ? (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter>
          <div className="flex gap-4 w-full">
            <Button onClick={() => window.location.reload()} disabled={isLoading} variant="outline" className="flex-1">
              {isLoading ? "Creazione in corso..." : "Aggiorna"}
            </Button>
            <Button onClick={() => (window.location.href = "/login")} className="flex-1">
              Vai al Login
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

