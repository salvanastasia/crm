"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateService } from "@/lib/actions"
import type { Service } from "@/lib/types"

interface EditServiceDialogProps {
  service: Service
  open: boolean
  onOpenChange: (open: boolean) => void
  onServiceUpdated: (service: Service) => void
}

export function EditServiceDialog({ service, open, onOpenChange, onServiceUpdated }: EditServiceDialogProps) {
  const [name, setName] = useState(service.name)
  const [duration, setDuration] = useState(service.duration.toString())
  const [price, setPrice] = useState(service.price.toString())
  const [comparePrice, setComparePrice] = useState(service.comparePrice ? service.comparePrice.toString() : "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(service.name)
      setDuration(service.duration.toString())
      setPrice(service.price.toString())
      setComparePrice(service.comparePrice ? service.comparePrice.toString() : "")
    }
  }, [open, service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updatedService = await updateService({
        id: service.id,
        name,
        duration: Number.parseInt(duration),
        price: Number.parseFloat(price),
        comparePrice: comparePrice ? Number.parseFloat(comparePrice) : undefined,
      })

      onServiceUpdated(updatedService)
    } catch (error) {
      console.error("Error updating service:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Servizio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-duration">Durata (minuti)</Label>
              <Input
                id="edit-duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Prezzo (€)</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-comparePrice">Prezzo Comparativo (€) (opzionale)</Label>
              <Input
                id="edit-comparePrice"
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

