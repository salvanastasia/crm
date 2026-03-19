"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@/lib/mock-helpers"

export default function CreateRpcFunctionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  const createRpcFunction = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      // SQL per creare la funzione RPC
      const sql = `
      -- Crea una funzione RPC per ottenere le impostazioni del brand
      CREATE OR REPLACE FUNCTION public.get_business_settings()
      RETURNS TABLE (
        id text,
        business_name text,
        brand_color text,
        logo_url text
      ) 
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          business_settings.id::text,
          business_settings.business_name,
          business_settings.brand_color,
          business_settings.logo_url
        FROM business_settings
        LIMIT 1;
      END;
      $$;

      -- Concedi i permessi necessari
      GRANT EXECUTE ON FUNCTION public.get_business_settings() TO authenticated;
      GRANT EXECUTE ON FUNCTION public.get_business_settings() TO anon;
      GRANT EXECUTE ON FUNCTION public.get_business_settings() TO service_role;
      `

      // Esegui lo script SQL
      const { error: sqlError } = await supabase.rpc("exec_sql", { sql })

      if (sqlError) {
        throw new Error(sqlError.message)
      }

      setResult("Funzione RPC creata con successo!")
    } catch (err) {
      console.error("Errore durante la creazione della funzione RPC:", err)
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Crea Funzione RPC</CardTitle>
          <CardDescription>
            Questo script crea la funzione RPC necessaria per accedere alle impostazioni del brand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-96">
            {`-- Crea una funzione RPC per ottenere le impostazioni del brand
CREATE OR REPLACE FUNCTION public.get_business_settings()
RETURNS TABLE (
  id text,
  business_name text,
  brand_color text,
  logo_url text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    business_settings.id::text,
    business_settings.business_name,
    business_settings.brand_color,
    business_settings.logo_url
  FROM business_settings
  LIMIT 1;
END;
$$;

-- Concedi i permessi necessari
GRANT EXECUTE ON FUNCTION public.get_business_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_settings() TO anon;
GRANT EXECUTE ON FUNCTION public.get_business_settings() TO service_role;`}
          </pre>

          {result && <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">{result}</div>}

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
              <p className="font-semibold">Errore:</p>
              <p>{error}</p>
              <p className="mt-2 text-sm">
                Puoi anche eseguire questo script direttamente nell&apos;editor SQL di Supabase.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={createRpcFunction} disabled={isLoading}>
            {isLoading ? "Creazione in corso..." : "Crea Funzione RPC"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

