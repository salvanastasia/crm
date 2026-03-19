"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function UpdatePasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Password disattivata</CardTitle>
          <CardDescription>Questo progetto ora usa solo Magic Link email.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-primary hover:underline text-sm">
            Torna al login
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

