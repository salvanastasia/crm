// Appuntamenti di oggi: dati reali da Supabase (non mock)
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { useAuth } from "@/components/auth-context"
import { getAppointments, getClientAppointments } from "@/lib/actions"
import type { Appointment } from "@/lib/types"

type AppointmentsListProps = {
  selectedDate?: Date
}

export function AppointmentsList({ selectedDate }: AppointmentsListProps) {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  const selectedDayKey = useMemo(() => format(selectedDate ?? new Date(), "yyyy-MM-dd"), [selectedDate])

  useEffect(() => {
    if (!user) return

    const load = async () => {
      setLoading(true)
      try {
        if (user.role === "client") {
          const rows = await getClientAppointments(user.id)
          setAppointments(rows)
          return
        }

        if (user.barberId) {
          const rows = await getAppointments(user.barberId)
          setAppointments(rows)
          return
        }

        setAppointments([])
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user?.id, user?.role, user?.barberId])

  const dayAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (!a.date) return false
      const key = typeof a.date === "string" ? a.date : format(a.date, "yyyy-MM-dd")
      return key === selectedDayKey
    })
  }, [appointments, selectedDayKey])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appuntamenti del Giorno</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Caricamento...</p>
          ) : dayAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground">Nessun appuntamento per il giorno selezionato</p>
          ) : (
            dayAppointments.map((appointment) => (
              <div key={appointment.id} className="flex flex-col space-y-2 border-b pb-4 last:border-0">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{appointment.clientName}</div>
                  <Badge
                    variant={
                      appointment.status === "confirmed" ? "default" : appointment.status === "cancelled" ? "destructive" : "outline"
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {appointment.serviceName} - {appointment.time}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

