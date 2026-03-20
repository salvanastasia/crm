"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { UpdatePasswordForm } from "@/components/auth/update-password-form"

export default function UpdatePasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Password disattivata</CardTitle>
          <CardDescription>Imposta una nuova password usando il link ricevuto via email.</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
        <div className="px-6 pb-6">
          <div className="text-sm text-center text-muted-foreground mt-2">
            <Link href="/login" className="text-primary hover:underline">
              Torna al login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

