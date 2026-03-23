"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-context"
import { getClientAppointments } from "@/lib/actions"
import type { Appointment } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

export default function LeTuePrenotazioniPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }
    if (user?.role !== "client") {
      router.replace("/dashboard")
    }
  }, [isLoading, isAuthenticated, user?.role, router])

  useEffect(() => {
    if (!user || user.role !== "client") return
    const load = async () => {
      setLoadingAppointments(true)
      try {
        const rows = await getClientAppointments(user.id)
        setAppointments(rows)
      } finally {
        setLoadingAppointments(false)
      }
    }
    void load()
  }, [user?.id, user?.role])

  useEffect(() => {
    if (searchParams.get("booked") !== "1") return
    toast({
      title: "Prenotazione completata",
      description: "La tua prenotazione e' stata inviata con successo.",
    })
  }, [searchParams])

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const aDate = typeof a.date === "string" ? a.date : format(a.date, "yyyy-MM-dd")
      const bDate = typeof b.date === "string" ? b.date : format(b.date, "yyyy-MM-dd")
      if (aDate === bDate) return a.time.localeCompare(b.time)
      return aDate.localeCompare(bDate)
    })
  }, [appointments])

  const statusLabel = (status: Appointment["status"]) => {
    if (status === "confirmed") return "Confermato"
    if (status === "cancelled") return "Rifiutato"
    if (status === "pending") return "In attesa"
    return status
  }

  const statusClassName = (status: Appointment["status"]) => {
    if (status === "confirmed") {
      return "bg-emerald-100 text-emerald-900 border-emerald-200"
    }
    if (status === "cancelled") {
      return "bg-rose-200 text-rose-800 border-rose-300"
    }
    if (status === "pending") {
      return "bg-[hsl(34.3_100%_91.8%)] text-[hsl(15.3_74.6%_27.8%)] border-[hsl(34.3_70%_75%)]"
    }
    return ""
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Le Tue Prenotazioni</h1>

      <Card>
        <CardHeader>
          <CardTitle>Prenotazioni Effettuate</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAppointments ? (
            <p className="text-muted-foreground">Caricamento...</p>
          ) : sortedAppointments.length === 0 ? (
            <p className="text-muted-foreground">Non hai ancora prenotazioni.</p>
          ) : (
            <div className="space-y-4">
              {sortedAppointments.map((appointment) => {
                const date = typeof appointment.date === "string" ? parseISO(appointment.date) : appointment.date
                return (
                  <div key={appointment.id} className="flex items-center justify-between gap-4 border-b pb-4 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-16 rounded-xl bg-zinc-100 text-zinc-800 flex flex-col items-center justify-center shrink-0 border border-zinc-200">
                        <span className="text-xs font-semibold uppercase leading-none">{format(date, "MMM", { locale: it })}</span>
                        <span className="text-2xl font-bold leading-none mt-1">{format(date, "d")}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{appointment.serviceName || "Servizio"}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {appointment.resourceName || "Staff"} - {String(appointment.time).slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={statusClassName(appointment.status)}
                    >
                      {statusLabel(appointment.status)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

