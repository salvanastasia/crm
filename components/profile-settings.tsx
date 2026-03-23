"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.slice(-1).join(""),
  }
}

export function ProfileSettings() {
  const { user, refreshProfile } = useAuth()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const { firstName: initialFirstName, lastName: initialLastName } = splitName(user?.name || "")
    setFirstName(initialFirstName)
    setLastName(initialLastName)
    setAvatarUrl(user?.avatarUrl || "")
    setPreviewUrl(user?.avatarUrl || null)
  }, [user?.name, user?.avatarUrl])

  const initials = useMemo(() => {
    const fullName = `${firstName} ${lastName}`.trim()
    if (!fullName) return "U"
    return fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [firstName, lastName])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setError(null)
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    void (async () => {
      setIsUploading(true)
      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error("Supabase client non disponibile")

        const extFromName = file.name.split(".").pop()?.toLowerCase()
        const ext = extFromName || (file.type.includes("png") ? "png" : file.type.includes("jpeg") ? "jpg" : "png")
        const ownerFolder = user.barberId || user.id
        const objectPath = `${ownerFolder}/profiles/${user.id}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from("logos")
          .upload(objectPath, file, { upsert: true, contentType: file.type || undefined })
        if (uploadError) throw uploadError

        const { data } = supabase.storage.from("logos").getPublicUrl(objectPath)
        const publicUrl = data?.publicUrl
        if (!publicUrl) throw new Error("Impossibile generare URL pubblico")

        setAvatarUrl(publicUrl)
        setPreviewUrl(publicUrl)
      } catch (uploadErr) {
        console.error("profile photo upload:", uploadErr)
        setError("Errore durante il caricamento della foto profilo.")
      } finally {
        setIsUploading(false)
        URL.revokeObjectURL(localPreview)
      }
    })()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || isUploading) return
    setError(null)
    setIsSaving(true)
    setIsSaved(false)

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error("Supabase client non disponibile")

      const fullName = `${firstName} ${lastName}`.trim()
      if (!fullName) {
        setError("Inserisci nome e cognome.")
        return
      }

      const { error: profileError } = await supabase.from("profiles").update({ name: fullName }).eq("id", user.id)
      if (profileError) throw profileError

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: fullName,
          avatar_url: avatarUrl || null,
        },
      })
      if (authError) throw authError

      await refreshProfile()
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2500)
    } catch (submitErr) {
      console.error("profile settings update:", submitErr)
      setError("Errore durante il salvataggio del profilo.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profilo</CardTitle>
        <CardDescription>Carica la foto profilo e aggiorna i tuoi dati personali</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profile-photo">Foto profilo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={previewUrl || ""} alt="Foto profilo" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <Input id="profile-photo" type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">Nome</Label>
              <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Cognome</Label>
              <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" value={user?.email || ""} readOnly />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={isSaving || isUploading}>
            {isUploading ? "Caricamento foto..." : isSaving ? "Salvataggio..." : isSaved ? "Salvato!" : "Salva profilo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
