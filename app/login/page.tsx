"use client"

import { Suspense } from "react"
import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { AuthCoverImage } from "@/components/auth-cover-image"

function LoginPageContent() {
  return (
    <div className="grid min-h-svh md:grid-cols-2">
      <AuthCoverImage />
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Barber CRM
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Caricamento…
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
