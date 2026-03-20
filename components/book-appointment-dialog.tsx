"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-context"
import { bookAppointment, getServices, getResources } from "@/lib/actions"
import type { Service, Resource } from "@/lib/types"

interface BookAppointmentDialogProps {
  date: Date
  time: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookAppointmentDialog({ date, time, open, onOpenChange }: BookAppointmentDialogProps) {
  const { user } = useAuth()
  const barberId = user?.barberId
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [resourceId, setResourceId] = useState("")
  const [services, setServices] = useState<Service[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [availableResources, setAvailableResources] = useState<Resource[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !barberId) return
    const loadData = async () => {
      const servicesData = await getServices(barberId)
      const resourcesData = await getResources(barberId)
      setServices(servicesData)
      setResources(resourcesData)
    }

    void loadData()
  }, [open, barberId])

  // Filtra le risorse disponibili in base al servizio selezionato
  useEffect(() => {
    if (serviceId) {
      const filteredResources = resources.filter(
        (resource) => resource.isActive && resource.serviceIds && resource.serviceIds.includes(serviceId),
      )
      setAvailableResources(filteredResources)

      // Reset della risorsa selezionata se non è disponibile per questo servizio
      if (resourceId && !filteredResources.some((r) => r.id === resourceId)) {
        setResourceId("")
      }
    } else {
      setAvailableResources([])
      setResourceId("")
    }
  }, [serviceId, resources, resourceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!barberId) return
      const res = await bookAppointment({
        barberId,
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        serviceId,
        resourceId,
        date,
        time,
      })
      if (!res.success) {
        console.error(res.message)
        return
      }

      onOpenChange(false)

      // Reload page to show new appointment
      window.location.reload()
    } catch (error) {
      console.error("Error booking appointment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Prenota Appuntamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <div className="font-medium">Data:</div>
              <div>{format(date, "EEEE d MMMM yyyy", { locale: it })}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="font-medium">Ora:</div>
              <div>{time}</div>
            </div>
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
              <Label htmlFor="service">Servizio</Label>
              <Select value={serviceId} onValueChange={setServiceId} required>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Seleziona un servizio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - €{service.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource">Barbiere</Label>
              <Select
                value={resourceId}
                onValueChange={setResourceId}
                required
                disabled={!serviceId || availableResources.length === 0}
              >
                <SelectTrigger id="resource">
                  <SelectValue
                    placeholder={
                      !serviceId
                        ? "Seleziona prima un servizio"
                        : availableResources.length === 0
                          ? "Nessun barbiere disponibile per questo servizio"
                          : "Seleziona un barbiere"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableResources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name} - {resource.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || !serviceId || !resourceId}>
              {isSubmitting ? "Prenotazione in corso..." : "Prenota"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

