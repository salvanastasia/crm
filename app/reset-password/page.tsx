"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reimposta password</CardTitle>
          <CardDescription>
            Riceverai un&apos;email con un link per impostare una nuova password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-center text-muted-foreground mt-2">
            <Link href="/login" className="text-primary hover:underline">
              Torna al login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
