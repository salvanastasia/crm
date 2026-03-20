"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateClient } from "@/lib/actions"
import type { Client } from "@/lib/types"

interface EditClientDialogProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientUpdated: (client: Client) => void
}

export function EditClientDialog({ client, open, onOpenChange, onClientUpdated }: EditClientDialogProps) {
  const [name, setName] = useState(client.name)
  const [email, setEmail] = useState(client.email)
  const [phone, setPhone] = useState(client.phone)
  const [notes, setNotes] = useState(client.notes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(client.name)
      setEmail(client.email)
      setPhone(client.phone)
      setNotes(client.notes || "")
    }
  }, [open, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updatedClient = await updateClient({
        id: client.id,
        name,
        email,
        phone,
        notes,
        barberId: client.barberId,
        appointmentsCount: client.appointmentsCount,
      })

      if (updatedClient) {
        onClientUpdated(updatedClient)
      }
    } catch (error) {
      console.error("Error updating client:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome e Cognome</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Telefono</Label>
              <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Note (opzionale)</Label>
              <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
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

