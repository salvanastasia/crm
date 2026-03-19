"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Accesso senza password</CardTitle>
          <CardDescription>Usiamo Magic Link via email, quindi non serve recuperare password.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Vai alla pagina di login e richiedi un nuovo Magic Link.</p>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-center text-muted-foreground mt-2">
            <Link href="/login" className="text-primary hover:underline">
              Vai al login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

