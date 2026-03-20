"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-context"
import { addService } from "@/lib/actions"

interface AddServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddServiceDialog({ open, onOpenChange }: AddServiceDialogProps) {
  const { user } = useAuth()
  const barberId = user?.barberId
  const [name, setName] = useState("")
  const [duration, setDuration] = useState("")
  const [price, setPrice] = useState("")
  const [comparePrice, setComparePrice] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!barberId) return
      const created = await addService({
        name,
        duration: Number.parseInt(duration, 10),
        price: Number.parseFloat(price),
        comparePrice: comparePrice ? Number.parseFloat(comparePrice) : undefined,
        barberId,
      })

      // Reset form
      setName("")
      setDuration("")
      setPrice("")
      setComparePrice("")
      onOpenChange(false)

      // Notify the list to refetch (avoid full page reload -> "Caricamento..." hang).
      window.dispatchEvent(new CustomEvent("servicesUpdated", { detail: { barberId } }))
    } catch (error) {
      console.error("Error adding service:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Servizio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Durata (minuti)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Prezzo (€)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comparePrice">Prezzo Comparativo (€) (opzionale)</Label>
              <Input
                id="comparePrice"
                type="number"
                min="0"
                step="0.01"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
              />
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

