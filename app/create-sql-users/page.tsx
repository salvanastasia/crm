"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

export default function CreateSqlUsersPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [sqlQuery, setSqlQuery] = useState(`
-- Elimina gli utenti esistenti se necessario (opzionale)
DELETE FROM auth.users WHERE email IN ('admin@barbercrm.com', 'cliente@example.com');
DELETE FROM public.profiles WHERE email IN ('admin@barbercrm.com', 'cliente@example.com');

-- Crea un utente admin
INSERT INTO auth.users (
  id, email, raw_user_meta_data, raw_app_meta_data, 
  encrypted_password, email_confirmed_at, created_at, updated_at, 
  confirmation_token, is_sso_user
)
VALUES (
  gen_random_uuid(), 'admin@barbercrm.com', 
  '{"name":"Admin Test","role":"admin"}',
  '{"provider":"email","providers":["email"]}',
  crypt('Admin123!', gen_salt('bf')), 
  now(), now(), now(),
  '', false
)
RETURNING id;

-- Inserisci il profilo admin
INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
SELECT id, 'Admin Test', 'admin@barbercrm.com', 'admin', now(), now()
FROM auth.users
WHERE email = 'admin@barbercrm.com';

-- Crea un utente cliente
INSERT INTO auth.users (
  id, email, raw_user_meta_data, raw_app_meta_data, 
  encrypted_password, email_confirmed_at, created_at, updated_at,
  confirmation_token, is_sso_user
)
VALUES (
  gen_random_uuid(), 'cliente@example.com', 
  '{"name":"Cliente Test","role":"client"}',
  '{"provider":"email","providers":["email"]}',
  crypt('Cliente123!', gen_salt('bf')), 
  now(), now(), now(),
  '', false
)
RETURNING id;

-- Inserisci il profilo cliente
INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
SELECT id, 'Cliente Test', 'cliente@example.com', 'client', now(), now()
FROM auth.users
WHERE email = 'cliente@example.com';
  `)

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlQuery)
    setResult({
      success: true,
      message: "SQL copiato negli appunti! Incollalo nell'editor SQL di Supabase.",
    })
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Crea Utenti di Test con SQL</CardTitle>
          <CardDescription>
            Copia questo SQL ed eseguilo nell'editor SQL di Supabase per creare gli utenti di test
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              <AlertDescription className="whitespace-pre-line">{result.message}</AlertDescription>
            </Alert>
          )}
          <p className="mb-4">Questo SQL creerà due utenti di test:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>
              <strong>Admin:</strong> admin@barbercrm.com / Admin123!
            </li>
            <li>
              <strong>Cliente:</strong> cliente@example.com / Cliente123!
            </li>
          </ul>

          <div className="mt-4">
            <Textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="font-mono text-sm h-80"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCopySql} className="w-full">
            Copia SQL negli appunti
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

