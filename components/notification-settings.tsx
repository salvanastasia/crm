"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { getNotificationSettings, updateNotificationSettings } from "@/lib/actions"
import type { NotificationSettings as NotificationSettingsType } from "@/lib/types"

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsType>({
    emailEnabled: true,
    smsEnabled: false,
    emailTemplate:
      "Gentile {cliente},\n\nTi confermiamo l'appuntamento per {servizio} il giorno {data} alle ore {ora}.\n\nGrazie,\n{negozio}",
    smsTemplate: "Conferma appuntamento: {servizio} il {data} alle {ora}. {negozio}",
    reminderHours: 24,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getNotificationSettings()
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
      await updateNotificationSettings(settings)
      setIsSaved(true)

      setTimeout(() => {
        setIsSaved(false)
      }, 3000)
    } catch (error) {
      console.error("Error updating notification settings:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impostazioni Notifiche</CardTitle>
        <CardDescription>Configura come e quando inviare notifiche ai clienti</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-toggle" className="font-medium">
                  Notifiche Email
                </Label>
                <p className="text-sm text-muted-foreground">Invia email di conferma e promemoria</p>
              </div>
              <Switch
                id="email-toggle"
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, emailEnabled: checked })}
              />
            </div>

            {settings.emailEnabled && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="email-template">Template Email</Label>
                <Textarea
                  id="email-template"
                  value={settings.emailTemplate}
                  onChange={(e) => setSettings({ ...settings, emailTemplate: e.target.value })}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Usa {"{cliente}"}, {"{servizio}"}, {"{data}"}, {"{ora}"}, {"{negozio}"} come variabili
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <div>
                <Label htmlFor="sms-toggle" className="font-medium">
                  Notifiche SMS
                </Label>
                <p className="text-sm text-muted-foreground">Invia SMS di conferma e promemoria</p>
              </div>
              <Switch
                id="sms-toggle"
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, smsEnabled: checked })}
              />
            </div>

            {settings.smsEnabled && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="sms-template">Template SMS</Label>
                <Textarea
                  id="sms-template"
                  value={settings.smsTemplate}
                  onChange={(e) => setSettings({ ...settings, smsTemplate: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Usa {"{cliente}"}, {"{servizio}"}, {"{data}"}, {"{ora}"}, {"{negozio}"} come variabili
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <div>
                <Label htmlFor="reminder-hours" className="font-medium">
                  Promemoria
                </Label>
                <p className="text-sm text-muted-foreground">Ore prima dell'appuntamento per inviare il promemoria</p>
              </div>
              <select
                id="reminder-hours"
                value={settings.reminderHours}
                onChange={(e) => setSettings({ ...settings, reminderHours: Number.parseInt(e.target.value) })}
                className="rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="1">1 ora prima</option>
                <option value="2">2 ore prima</option>
                <option value="3">3 ore prima</option>
                <option value="6">6 ore prima</option>
                <option value="12">12 ore prima</option>
                <option value="24">24 ore prima</option>
                <option value="48">2 giorni prima</option>
              </select>
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

