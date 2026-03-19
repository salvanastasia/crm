"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBusinessHours, updateBusinessHours } from "@/lib/actions"
import type { BusinessHours as BusinessHoursType } from "@/lib/types"

const DAYS = [
  { id: "monday", label: "Lunedì" },
  { id: "tuesday", label: "Martedì" },
  { id: "wednesday", label: "Mercoledì" },
  { id: "thursday", label: "Giovedì" },
  { id: "friday", label: "Venerdì" },
  { id: "saturday", label: "Sabato" },
  { id: "sunday", label: "Domenica" },
]

const TIME_OPTIONS = Array.from({ length: 24 * 2 }).map((_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? "00" : "30"
  return `${hour.toString().padStart(2, "0")}:${minute}`
})

export function BusinessHours() {
  const [hours, setHours] = useState<BusinessHoursType>({
    monday: { isOpen: true, open: "09:00", close: "18:00" },
    tuesday: { isOpen: true, open: "09:00", close: "18:00" },
    wednesday: { isOpen: true, open: "09:00", close: "18:00" },
    thursday: { isOpen: true, open: "09:00", close: "18:00" },
    friday: { isOpen: true, open: "09:00", close: "18:00" },
    saturday: { isOpen: true, open: "09:00", close: "13:00" },
    sunday: { isOpen: false, open: "09:00", close: "18:00" },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const loadHours = async () => {
      const data = await getBusinessHours()
      if (data) {
        setHours(data)
      }
    }

    loadHours()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsSaved(false)

    try {
      await updateBusinessHours(hours)
      setIsSaved(true)

      setTimeout(() => {
        setIsSaved(false)
      }, 3000)
    } catch (error) {
      console.error("Error updating business hours:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDayToggle = (day: string) => {
    setHours({
      ...hours,
      [day]: {
        ...hours[day as keyof BusinessHoursType],
        isOpen: !hours[day as keyof BusinessHoursType].isOpen,
      },
    })
  }

  const handleTimeChange = (day: string, type: "open" | "close", value: string) => {
    setHours({
      ...hours,
      [day]: {
        ...hours[day as keyof BusinessHoursType],
        [type]: value,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orari di Apertura</CardTitle>
        <CardDescription>Imposta gli orari di apertura della tua attività</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {DAYS.map((day) => (
              <div key={day.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`${day.id}-toggle`}
                    checked={hours[day.id as keyof BusinessHoursType].isOpen}
                    onCheckedChange={() => handleDayToggle(day.id)}
                  />
                  <Label htmlFor={`${day.id}-toggle`}>{day.label}</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={hours[day.id as keyof BusinessHoursType].open}
                    onValueChange={(value) => handleTimeChange(day.id, "open", value)}
                    disabled={!hours[day.id as keyof BusinessHoursType].isOpen}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={`${day.id}-open-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span>-</span>

                  <Select
                    value={hours[day.id as keyof BusinessHoursType].close}
                    onValueChange={(value) => handleTimeChange(day.id, "close", value)}
                    disabled={!hours[day.id as keyof BusinessHoursType].isOpen}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={`${day.id}-close-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvataggio..." : isSaved ? "Salvato!" : "Salva Orari"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

