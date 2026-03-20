"use client"

import { useState, useEffect } from "react"
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, isToday, isBefore } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getBusinessHours } from "@/lib/actions"
import type { BusinessHours } from "@/lib/types"

interface DateTimeSelectorProps {
  barberId: string
  selectedDate: Date | null
  selectedTime: string | null
  onSelectDate: (date: Date) => void
  onSelectTime: (time: string) => void
  onNext: () => void
  onBack: () => void
}

export function DateTimeSelector({
  barberId,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  onNext,
  onBack,
}: DateTimeSelectorProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))

  useEffect(() => {
    if (!barberId) return
    const loadBusinessHours = async () => {
      setIsLoading(true)
      try {
        const hours = await getBusinessHours(barberId)
        setBusinessHours(hours)
      } catch (error) {
        console.error("Error loading business hours:", error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadBusinessHours()
  }, [barberId])

  useEffect(() => {
    if (selectedDate && businessHours) {
      // Determina il giorno della settimana
      const dayOfWeek = format(selectedDate, "EEEE", { locale: it }).toLowerCase()
      const dayKey = getDayKey(dayOfWeek)

      if (dayKey && businessHours[dayKey]?.isOpen) {
        // Genera gli slot di tempo disponibili
        const { open, close } = businessHours[dayKey]
        const slots = generateTimeSlots(open, close)
        setAvailableTimeSlots(slots)
      } else {
        setAvailableTimeSlots([])
      }
    } else {
      setAvailableTimeSlots([])
    }
  }, [selectedDate, businessHours])

  const getDayKey = (italianDay: string): keyof BusinessHours | null => {
    const dayMap: Record<string, keyof BusinessHours> = {
      lunedì: "monday",
      martedì: "tuesday",
      mercoledì: "wednesday",
      giovedì: "thursday",
      venerdì: "friday",
      sabato: "saturday",
      domenica: "sunday",
    }
    return dayMap[italianDay] || null
  }

  const generateTimeSlots = (open: string, close: string): string[] => {
    const slots: string[] = []
    const [openHour, openMinute] = open.split(":").map(Number)
    const [closeHour, closeMinute] = close.split(":").map(Number)

    let currentHour = openHour
    let currentMinute = openMinute

    while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
      slots.push(`${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`)

      currentMinute += 30
      if (currentMinute >= 60) {
        currentHour += 1
        currentMinute = 0
      }
    }

    return slots
  }

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1))
  }

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1))
  }

  const isDayAvailable = (date: Date): boolean => {
    if (isBefore(date, new Date()) && !isToday(date)) {
      return false
    }

    const dayOfWeek = format(date, "EEEE", { locale: it }).toLowerCase()
    const dayKey = getDayKey(dayOfWeek)

    return dayKey !== null && businessHours?.[dayKey]?.isOpen === true
  }

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento disponibilità...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Seleziona data e ora</h2>
        <p className="text-sm text-muted-foreground mt-1">Scegli quando prenotare il tuo appuntamento</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              <h3 className="text-lg font-semibold">{format(startDate, "MMMM yyyy", { locale: it })}</h3>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day.toString()} className="text-center">
                <div className="text-sm font-medium">{format(day, "EEE", { locale: it })}</div>
                <div className="text-sm">{format(day, "d", { locale: it })}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const isAvailable = isDayAvailable(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <div key={day.toString()} className="border rounded-md p-1">
                  <button
                    className={cn(
                      "w-full py-2 rounded-md text-sm font-medium",
                      isAvailable
                        ? "hover:bg-primary/10 cursor-pointer"
                        : "bg-muted text-muted-foreground cursor-not-allowed",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                    disabled={!isAvailable}
                    onClick={() => onSelectDate(day)}
                  >
                    {isToday(day) ? "Oggi" : format(day, "d", { locale: it })}
                  </button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">
            Orari disponibili per {format(selectedDate, "EEEE d MMMM", { locale: it })}
          </h3>

          {availableTimeSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {availableTimeSlots.map((time) => (
                <button
                  key={time}
                  className={cn(
                    "py-2 px-3 rounded-md text-sm font-medium border",
                    selectedTime === time
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-primary/10 hover:border-primary",
                  )}
                  onClick={() => onSelectTime(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Nessun orario disponibile per questa data.</p>
          )}
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button onClick={onBack} variant="outline">
          Indietro
        </Button>
        <Button onClick={onNext} disabled={!selectedDate || !selectedTime}>
          Continua
        </Button>
      </div>
    </div>
  )
}

