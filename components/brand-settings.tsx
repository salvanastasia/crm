"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getBrandSettings, updateBrandSettings } from "@/lib/actions"
import type { BrandSettings as BrandSettingsType } from "@/lib/types"

export function BrandSettings() {
  const [settings, setSettings] = useState<BrandSettingsType>({
    businessName: "",
    brandColor: "#4f46e5",
    logoUrl: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getBrandSettings()
      if (data) {
        setSettings(data)
      }
    }

    loadSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsSaved(false)

    try {
      await updateBrandSettings(settings)
      setIsSaved(true)

      // Applica il colore del brand alle variabili CSS
      const root = document.documentElement
      const color = settings.brandColor

      // Converti hex in hsl
      const r = Number.parseInt(color.slice(1, 3), 16) / 255
      const g = Number.parseInt(color.slice(3, 5), 16) / 255
      const b = Number.parseInt(color.slice(5, 7), 16) / 255

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h,
        s,
        l = (max + min) / 2

      if (max === min) {
        h = s = 0 // achromatic
      } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0)
            break
          case g:
            h = (b - r) / d + 2
            break
          case b:
            h = (r - g) / d + 4
            break
          default:
            h = 0
        }
        h /= 6
      }

      h = Math.round(h * 360)
      s = Math.round(s * 100)
      l = Math.round(l * 100)

      root.style.setProperty("--primary", `${h} ${s}% ${l}%`)

      // Emetti un evento personalizzato per notificare l'aggiornamento delle impostazioni
      const event = new CustomEvent("brandSettingsUpdated", { detail: settings })
      window.dispatchEvent(event)

      setTimeout(() => {
        setIsSaved(false)
      }, 3000)
    } catch (error) {
      console.error("Error updating brand settings:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you would upload this file to a storage service
      // For this demo, we'll create a local URL
      const url = URL.createObjectURL(file)
      setSettings({
        ...settings,
        logoUrl: url,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalizzazione Brand</CardTitle>
        <CardDescription>Personalizza l'aspetto del tuo CRM con i colori e il logo del tuo brand</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="businessName">Nome Attività</Label>
            <Input
              id="businessName"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
              placeholder="Il tuo Barbiere"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandColor">Colore Brand</Label>
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[100px] h-[36px] border-2"
                    style={{ backgroundColor: settings.brandColor }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <HexColorPicker
                    color={settings.brandColor}
                    onChange={(color) => setSettings({ ...settings, brandColor: color })}
                  />
                </PopoverContent>
              </Popover>
              <Input
                id="brandColor"
                value={settings.brandColor}
                onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                className="w-[100px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <div className="flex items-center gap-4">
              {settings.logoUrl && (
                <div className="w-16 h-16 rounded-md border flex items-center justify-center overflow-hidden">
                  <img
                    src={settings.logoUrl || "/placeholder.svg"}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvataggio..." : isSaved ? "Salvato!" : "Salva Impostazioni"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

