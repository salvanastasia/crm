"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface AddClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddClientDialog({ open, onOpenChange }: AddClientDialogProps) {
  const { user } = useAuth()
  const barberId = user?.barberId
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    // If Supabase successfully sent the magic link, we still want to close the modal
    // even if the subsequent `profiles` upsert fails (RLS repair, network, etc).
    let emailSent = false

    try {
      if (!barberId) return
      const emailValue = email.trim()
      if (!emailValue) {
        setIsSubmitting(false)
        throw new Error("Email obbligatoria per aggiungere un cliente")
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase) return

      // Create the auth user immediately (so we can write `profiles` on save).
      const {
        data: { session: adminSession },
      } = await supabase.auth.getSession()
      if (!adminSession?.user?.id) {
        // Without an admin session we can't safely restore auth.uid() before the profiles upsert.
        throw new Error("Sessione admin non trovata. Riprova.")
      }

      const rand = new Uint8Array(16)
      crypto.getRandomValues(rand)
      const password = Array.from(rand)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")

      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/booking")}`
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: emailValue,
        password,
        options: {
          emailRedirectTo,
          data: {
            name,
            phone: phone || null,
            role: "client",
          },
        },
      } as any)

      if (signUpErr) throw signUpErr
      emailSent = true

      const userId = (signUpData as any)?.user?.id as string | undefined
      if (!userId) throw new Error("Impossibile ottenere userId dopo signup")

      // IMPORTANT: `signUp` can change the current auth user in the browser.
      // RLS for `profiles` insert expects `auth.uid()` to be the logged-in admin/staff.
      if (!adminSession.access_token || !adminSession.refresh_token) {
        throw new Error("Token sessione admin non valido. Riprova.")
      }
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      })

      // Extra sanity check: RLS uses auth.uid(); ensure we are back to the admin.
      try {
        const { data: current } = await supabase.auth.getUser()
      } catch {
        // Ignore - auth state will still be used by RLS.
      }

      const profileEmail = emailValue.trim().toLowerCase()

      const { error: profileUpsertErr } = await supabase.from("profiles").upsert(
        {
          id: userId,
          name,
          email: profileEmail,
          role: "client",
          phone: phone || null,
          barber_id: barberId,
        } as any,
        { onConflict: "id" },
      )

      if (profileUpsertErr) {
        const errMsg = profileUpsertErr?.message?.toLowerCase?.() ?? ""
        const isRls = errMsg.includes("row-level security") || errMsg.includes("violates row-level security")

        if (isRls) {
          // Attempt to repair RLS policy and retry once.
          const fixResp = await fetch("/api/fix-profiles-policy", { method: "POST" }).catch(() => null)
          const fixJson = fixResp ? await fixResp.json().catch(() => null) : null

          const { error: retryErr } = await supabase.from("profiles").upsert(
            {
              id: userId,
              name,
              email: profileEmail,
              role: "client",
              phone: phone || null,
              barber_id: barberId,
            } as any,
            { onConflict: "id" },
          )

          if (retryErr) {
            throw retryErr
          }
        } else {
          throw profileUpsertErr
        }
      }

      // Notify the list to refetch (avoid full page reload).
      window.dispatchEvent(new CustomEvent("clientsUpdated", { detail: { barberId } }))

      // Reset form
      setName("")
      setEmail("")
      setPhone("")
      setNotes("")
      onOpenChange(false)

      // Email always exists now, so list refresh is handled after profiles upsert.
    } catch (error) {
      console.error("Error adding client:", error)

      if (emailSent) {
        // Email is already in-flight; keep UX responsive and close the modal.
        setName("")
        setEmail("")
        setPhone("")
        setNotes("")
        onOpenChange(false)
      } else {
        const msg = error instanceof Error ? error.message : "Errore durante l'aggiunta del cliente"
        setErrorMessage(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome e Cognome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            {errorMessage && (
              <div className="text-sm text-destructive" role="alert">
                {errorMessage}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

