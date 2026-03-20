"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function OnboardingPage() {
  const { user, isAuthenticated, isLoading, refreshProfile } = useAuth()
  const router = useRouter()
  const [businessName, setBusinessName] = useState("")
  const [shopEmail, setShopEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }
    if (user?.role === "client") {
      router.replace("/booking")
      return
    }
    if (user?.role !== "admin") {
      router.replace("/")
      return
    }
    if (user.barberId) {
      router.replace("/")
      return
    }
    setShopEmail(user.email ?? "")
    setBusinessName((prev) => prev || (user.name ? `Salone di ${user.name}` : ""))
  }, [isLoading, isAuthenticated, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Config Supabase mancante")
      return
    }
    const trimmed = businessName.trim()
    if (!trimmed) {
      setError("Inserisci il nome dell’attività")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const { data, error: insErr } = await supabase
        .from("barbers")
        .insert({
          name: user.name,
          email: (shopEmail.trim() || user.email) ?? "",
          phone: phone.trim() || null,
          address: address.trim() || null,
          business_name: trimmed,
          owner_id: user.id,
        })
        .select()
        .single()

      if (insErr) {
        setError(insErr.message)
        return
      }

      const { error: upErr } = await supabase.from("profiles").update({ barber_id: data.id }).eq("id", user.id)

      if (upErr) {
        setError(upErr.message)
        return
      }

      await refreshProfile()
      router.replace("/")
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">Caricamento…</div>
    )
  }

  if (user.role !== "admin" || user.barberId) {
    return null
  }

  return (
    <div className="w-full max-w-lg mx-auto py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Benvenuto, {user.name}</CardTitle>
          <CardDescription>
            Completa i dati del tuo salone per aprire la dashboard e ricevere prenotazioni dai clienti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nome attività *</Label>
              <Input
                id="businessName"
                placeholder="es. Barber Shop Centro"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopEmail">Email attività</Label>
              <Input
                id="shopEmail"
                type="email"
                placeholder={user.email ?? ""}
                value={shopEmail}
                onChange={(e) => setShopEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Indirizzo</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creazione in corso…" : "Crea salone e continua"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
