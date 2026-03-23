 "use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { getRecentAppointmentsForDashboard, updateAppointmentStatus } from "@/lib/actions"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type RecentAppointmentsResponse = {
  appointmentsCount: number
  recent: Array<{
    id: string
    clientName: string
    clientEmail: string
    initials: string
    amount: number
    date: string
    time: string
    status: "pending" | "confirmed" | "completed" | "cancelled"
  }>
}

export function RecentAppointments({ startDateKey, endDateKey }: { startDateKey: string; endDateKey: string }) {
  const { user } = useAuth()
  const [data, setData] = useState<RecentAppointmentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const currency = useMemo(
    () => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }),
    [],
  )

  useEffect(() => {
    if (!user?.barberId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await getRecentAppointmentsForDashboard(user.barberId, startDateKey, endDateKey)
        if (!cancelled) setData(res)
      } catch (err) {
        console.error("RecentAppointments:", err)
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [user?.barberId, startDateKey, endDateKey])

  const appointmentsCount = data?.appointmentsCount ?? 0
  const recent = data?.recent ?? []
  const canManageAppointments = user?.role === "admin" || user?.role === "staff"

  const normalizeTime = (time: string) => String(time).slice(0, 5)

  const handleStatusChange = async (appointmentId: string, status: "confirmed" | "cancelled") => {
    if (!user?.barberId) return
    setUpdatingId(appointmentId)
    try {
      const ok = await updateAppointmentStatus(appointmentId, status, user.barberId)
      if (!ok) return
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          recent: prev.recent.map((a) => (a.id === appointmentId ? { ...a, status } : a)),
        }
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const statusLabel = (status: RecentAppointmentsResponse["recent"][number]["status"]) => {
    if (status === "confirmed") return "Confermato"
    if (status === "cancelled") return "Rifiutato"
    if (status === "pending") return "In attesa"
    if (status === "completed") return "Completato"
    return status
  }

  const statusClassName = (status: RecentAppointmentsResponse["recent"][number]["status"]) => {
    if (status === "confirmed") {
      return "bg-emerald-100 text-emerald-900 border-emerald-200"
    }
    if (status === "cancelled") {
      return "bg-rose-200 text-rose-800 border-rose-300"
    }
    if (status === "pending") {
      return "bg-[hsl(34.3_100%_91.8%)] text-[hsl(15.3_74.6%_27.8%)] border-[hsl(34.3_70%_75%)]"
    }
    return "bg-zinc-100 text-zinc-800 border-zinc-200"
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground mb-6">
        {loading ? "Caricamento..." : `Hai ${appointmentsCount} appuntamenti questa settimana.`}
      </p>

      {!loading && recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun appuntamento per questa settimana.</p>
      ) : null}

      {recent.map((appointment) => (
        <div key={appointment.id} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-16 h-16 rounded-xl bg-zinc-100 text-zinc-800 flex flex-col items-center justify-center shrink-0 border border-zinc-200">
              <span className="text-xs font-semibold uppercase leading-none">
                {format(parseISO(appointment.date), "MMM", { locale: it })}
              </span>
              <span className="text-2xl font-bold leading-none mt-1">{format(parseISO(appointment.date), "d")}</span>
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{appointment.clientName}</p>
              <p className="text-sm text-muted-foreground truncate">{appointment.clientEmail}</p>
              <p className="text-xs text-muted-foreground mt-1">{normalizeTime(appointment.time)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={statusClassName(appointment.status)}>
              {statusLabel(appointment.status)}
            </Badge>
            <div className="flex items-center gap-2">
              <div className="text-right font-medium min-w-20">{currency.format(appointment.amount)}</div>
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
                  variant="outline"
                  className="bg-rose-200 text-rose-950 border-rose-500 hover:bg-rose-700 hover:text-white dark:bg-rose-800 dark:text-rose-50 dark:border-rose-400 dark:hover:bg-rose-700 dark:hover:text-white"
                  disabled={updatingId === appointment.id}
                  onClick={() => handleStatusChange(appointment.id, "cancelled")}
                >
                  Rifiuta
                </Button>
              </>
            )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

