"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns"
import { it } from "date-fns/locale"
import { BookAppointmentDialog } from "@/components/book-appointment-dialog"
import { useAuth } from "@/components/auth-context"
import { getAppointments, getClientAppointments } from "@/lib/actions"
import type { Appointment } from "@/lib/types"

type CalendarProps = {
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

export function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
  ]

  const dateKey = (d: Date | string) => {
    // `appointments.date` is stored in DB as YYYY-MM-DD
    if (typeof d === "string") return d
    return format(d, "yyyy-MM-dd")
  }

  const isSlotBooked = (date: Date, time: string) => {
    const key = dateKey(date)
    return appointments.some((a) => a.date && dateKey(a.date) === key && a.time === time && a.status !== "cancelled")
  }

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        if (user.role === "client") {
          const rows = await getClientAppointments(user.id)
          setAppointments(rows)
        } else if (user.barberId) {
          const rows = await getAppointments(user.barberId)
          setAppointments(rows)
        } else {
          setAppointments([])
        }
      } catch (e) {
        console.error("Failed to load appointments:", e)
        setAppointments([])
      }
    }

    void load()
  }, [user?.id, user?.role, user?.barberId])

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1))
  }

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1))
  }

  const handleTimeSlotClick = (date: Date, time: string) => {
    if (!isSlotBooked(date, time)) {
      onSelectDate(date)
      setSelectedTime(time)
      setIsBookingDialogOpen(true)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              <h2 className="text-lg font-semibold">{format(startDate, "MMMM yyyy", { locale: it })}</h2>
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
              <div
                key={day.toString()}
                className={cn(
                  "text-center rounded-md py-1 cursor-pointer transition-colors",
                  isSameDay(day, selectedDate)
                    ? "bg-primary text-primary-foreground"
                    : isSameDay(day, new Date())
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted",
                )}
                onClick={() => onSelectDate(day)}
              >
                <div className="text-sm font-medium">{format(day, "EEE", { locale: it })}</div>
                <div className="text-sm">{format(day, "d", { locale: it })}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day.toString()} className="border rounded-md p-1">
                <div className="space-y-1">
                  {timeSlots.map((time) => {
                    const isBooked = isSlotBooked(day, time)
                    return (
                      <button
                        key={`${day}-${time}`}
                        className={cn(
                          "w-full text-xs py-1 rounded-sm border transition-colors",
                          isBooked
                            ? "bg-destructive/15 border-destructive/40 text-destructive font-medium cursor-not-allowed"
                            : "bg-primary/10 border-primary/20 hover:bg-primary/20 cursor-pointer",
                        )}
                        disabled={isBooked}
                        onClick={() => handleTimeSlotClick(day, time)}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTime && (
        <BookAppointmentDialog
          date={selectedDate}
          time={selectedTime}
          open={isBookingDialogOpen}
          onOpenChange={setIsBookingDialogOpen}
        />
      )}
    </>
  )
}

