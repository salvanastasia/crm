"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { updateResource } from "@/lib/actions"
import type { Resource, Service } from "@/lib/types"

interface EditResourceDialogProps {
  resource: Resource
  services: Service[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onResourceUpdated: (resource: Resource) => void
}

export function EditResourceDialog({
  resource,
  services,
  open,
  onOpenChange,
  onResourceUpdated,
}: EditResourceDialogProps) {
  const [name, setName] = useState(resource.name)
  const [email, setEmail] = useState(resource.email)
  const [phone, setPhone] = useState(resource.phone)
  const [role, setRole] = useState(resource.role)
  const [bio, setBio] = useState(resource.bio || "")
  const [isActive, setIsActive] = useState(resource.isActive)
  const [selectedServices, setSelectedServices] = useState<string[]>(resource.serviceIds || [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(resource.name)
      setEmail(resource.email)
      setPhone(resource.phone)
      setRole(resource.role)
      setBio(resource.bio || "")
      setIsActive(resource.isActive)
      setSelectedServices(resource.serviceIds || [])
    }
  }, [open, resource])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updatedResource = await updateResource({
        id: resource.id,
        name,
        email,
        phone,
        role,
        bio,
        isActive,
        serviceIds: selectedServices,
        imageUrl: resource.imageUrl,
      })

      onResourceUpdated(updatedResource)
    } catch (error) {
      console.error("Error updating resource:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Modifica Risorsa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome e Cognome</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Ruolo</Label>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Seleziona un ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Barbiere Senior">Barbiere Senior</SelectItem>
                    <SelectItem value="Barbiere">Barbiere</SelectItem>
                    <SelectItem value="Apprendista">Apprendista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Telefono</Label>
                <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-bio">Bio (opzionale)</Label>
              <Textarea id="edit-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>

            <div className="grid gap-2">
              <Label>Servizi Offerti</Label>
              <div className="grid grid-cols-2 gap-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-service-${service.id}`}
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <Label htmlFor={`edit-service-${service.id}`} className="text-sm font-normal">
                      {service.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="edit-active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="edit-active">Risorsa attiva</Label>
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

