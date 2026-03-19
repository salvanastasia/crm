"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@/lib/mock-helpers"

export default function InitDatabasePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const supabase = createClientComponentClient()

  const initializeDatabase = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // SQL per inizializzare la tabella business_settings
      const sql = `
      -- Verifica se la tabella business_settings esiste e creala se necessario
      CREATE TABLE IF NOT EXISTS public.business_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_name TEXT NOT NULL DEFAULT 'Barber CRM',
        brand_color TEXT DEFAULT '#4f46e5',
        logo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- Inserisci dati di esempio se la tabella è vuota
      INSERT INTO public.business_settings (business_name, brand_color, logo_url)
      SELECT 'Barber CRM', '#4f46e5', NULL
      WHERE NOT EXISTS (SELECT 1 FROM public.business_settings);

      -- Abilita RLS sulla tabella
      ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

      -- Crea una policy che consente l'accesso pubblico in sola lettura
      DROP POLICY IF EXISTS "Allow public read access to business_settings" ON public.business_settings;
      CREATE POLICY "Allow public read access to business_settings" 
      ON public.business_settings 
      FOR SELECT 
      USING (true);

      -- Crea una policy che consente agli admin di modificare le impostazioni
      DROP POLICY IF EXISTS "Allow admin to update business_settings" ON public.business_settings;
      CREATE POLICY "Allow admin to update business_settings" 
      ON public.business_settings 
      FOR UPDATE 
      USING (
        auth.uid() IN (
          SELECT id FROM profiles WHERE role = 'admin'
        )
      );

      -- Crea una policy che consente agli admin di inserire nuove impostazioni
      DROP POLICY IF EXISTS "Allow admin to insert business_settings" ON public.business_settings;
      CREATE POLICY "Allow admin to insert business_settings" 
      ON public.business_settings 
      FOR INSERT 
      WITH CHECK (
        auth.uid() IN (
          SELECT id FROM profiles WHERE role = 'admin'
        )
      );
      `

      // Esegui lo script SQL
      const { error } = await supabase.rpc("exec_sql", { sql })

      if (error) {
        throw new Error(error.message)
      }

      setResult({
        success: true,
        message: "Database inizializzato con successo! La tabella business_settings è stata creata e popolata.",
      })
    } catch (error) {
      console.error("Errore durante l'inizializzazione del database:", error)
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Si è verificato un errore durante l'inizializzazione del database.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Inizializza Database</CardTitle>
          <CardDescription>
            Questo strumento creerà e popolerà la tabella business_settings necessaria per il funzionamento
            dell'applicazione.
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
                Creare la tabella <code>business_settings</code> se non esiste
              </li>
              <li>Inserire dati di esempio nella tabella se è vuota</li>
              <li>Configurare le policy RLS per consentire l'accesso in lettura a tutti gli utenti</li>
              <li>Configurare le policy RLS per consentire l'accesso in scrittura solo agli admin</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Nota: Questo script è sicuro da eseguire più volte, non sovrascriverà i dati esistenti.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={initializeDatabase} disabled={isLoading} className="w-full">
            {isLoading ? "Inizializzazione in corso..." : "Inizializza Database"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

