// Appuntamenti di oggi: dati reali da Supabase (non mock)
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { useAuth } from "@/components/auth-context"
import { getAppointments, getClientAppointments, updateAppointmentStatus } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import type { Appointment } from "@/lib/types"

type AppointmentsListProps = {
  selectedDate?: Date
}

export function AppointmentsList({ selectedDate }: AppointmentsListProps) {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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

  const canManageAppointments = user?.role === "admin" || user?.role === "staff"

  const normalizeTime = (time: string) => String(time).slice(0, 5)

  const handleStatusChange = async (appointmentId: string, status: "confirmed" | "cancelled") => {
    if (!user?.barberId) return
    setUpdatingId(appointmentId)
    try {
      const ok = await updateAppointmentStatus(appointmentId, status, user.barberId)
      if (!ok) return

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status,
              }
            : a,
        ),
      )
    } finally {
      setUpdatingId(null)
    }
  }

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
              <div key={appointment.id} className="flex items-center justify-between gap-4 border-b pb-4 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-xl bg-black text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-semibold uppercase leading-none">
                      {format(new Date(appointment.date), "MMM", { locale: it })}
                    </span>
                    <span className="text-2xl font-bold leading-none mt-1">{format(new Date(appointment.date), "d")}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{appointment.clientName}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {appointment.serviceName} - {normalizeTime(appointment.time)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canManageAppointments && appointment.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={updatingId === appointment.id}
                        onClick={() => handleStatusChange(appointment.id, "confirmed")}
                      >
                        Conferma
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={updatingId === appointment.id}
                        onClick={() => handleStatusChange(appointment.id, "cancelled")}
                      >
                        Rifiuta
                      </Button>
                    </>
                  )}
                  <Badge
                    variant={
                      appointment.status === "confirmed" ? "default" : appointment.status === "cancelled" ? "destructive" : "outline"
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

