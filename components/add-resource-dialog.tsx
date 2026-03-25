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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"
import { addResource, getServices } from "@/lib/actions"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Service } from "@/lib/types"

interface AddResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddResourceDialog({ open, onOpenChange }: AddResourceDialogProps) {
  const { user } = useAuth()
  const barberId = user?.barberId
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("")
  const [bio, setBio] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadServices = async () => {
      if (!barberId) return
      const data = await getServices(barberId)
      setServices(data)
    }

    if (open && barberId) {
      void loadServices()
    }
  }, [open, barberId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!barberId) return
      await addResource({
        name,
        email,
        phone,
        role,
        bio,
        isActive,
        serviceIds: selectedServices,
        imageUrl,
        barberId,
      })

      // Reset form
      setName("")
      setEmail("")
      setPhone("")
      setRole("")
      setBio("")
      setIsActive(true)
      setSelectedServices([])
      setImageUrl("")
      setImagePreviewUrl(null)
      setImageUploadError(null)
      onOpenChange(false)

      // Reload page to show new resource
      window.location.reload()
    } catch (error) {
      console.error("Error adding resource:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const getInitials = (fullName: string) =>
    fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "D"

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !barberId) return

    const localPreview = URL.createObjectURL(file)
    setImagePreviewUrl(localPreview)
    setImageUploadError(null)

    void (async () => {
      setIsUploadingImage(true)
      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error("Supabase client unavailable")

        const extFromName = file.name.split(".").pop()?.toLowerCase()
        const ext = extFromName || (file.type.includes("png") ? "png" : file.type.includes("jpeg") ? "jpg" : "png")
        const objectPath = `${barberId}/resources/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("logos")
          .upload(objectPath, file, { upsert: true, contentType: file.type || undefined })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from("logos").getPublicUrl(objectPath)
        const publicUrl = data?.publicUrl
        if (!publicUrl) throw new Error("Failed to generate public URL")

        setImageUrl(publicUrl)
        setImagePreviewUrl(publicUrl)
      } catch (err) {
        console.error("Error uploading resource image:", err)
        setImageUploadError("Errore caricamento foto profilo. Riprova.")
      } finally {
        setIsUploadingImage(false)
        URL.revokeObjectURL(localPreview)
      }
    })()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Collaboratore</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="profile-image">Foto profilo (opzionale)</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={imagePreviewUrl || imageUrl || ""} alt="Foto collaboratore" />
                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <Input id="profile-image" type="file" accept="image/*" onChange={handleImageChange} />
              </div>
              {imageUploadError ? <p className="text-xs text-destructive">{imageUploadError}</p> : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome e Cognome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Ruolo</Label>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Seleziona un ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Collaboratore Senior">Collaboratore Senior</SelectItem>
                    <SelectItem value="Collaboratore">Collaboratore</SelectItem>
                    <SelectItem value="Apprendista">Apprendista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio">Bio (opzionale)</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>

            <div className="grid gap-2">
              <Label>Servizi Offerti</Label>
              <div className="grid grid-cols-2 gap-2">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${service.id}`}
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <Label htmlFor={`service-${service.id}`} className="text-sm font-normal">
                      {service.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="active">Collaboratore attivo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploadingImage}>
              {isUploadingImage ? "Caricamento foto..." : isSubmitting ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

