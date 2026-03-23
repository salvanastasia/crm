 "use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { getRecentAppointmentsForDashboard } from "@/lib/actions"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"

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
  }>
}

export function RecentAppointments({ startDateKey, endDateKey }: { startDateKey: string; endDateKey: string }) {
  const { user } = useAuth()
  const [data, setData] = useState<RecentAppointmentsResponse | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground mb-6">
        {loading ? "Caricamento..." : `Hai ${appointmentsCount} appuntamenti questo mese.`}
      </p>

      {recent.map((appointment) => (
        <div key={appointment.id} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-16 h-16 rounded-xl bg-black text-white flex flex-col items-center justify-center shrink-0">
              <span className="text-xs font-semibold uppercase leading-none">
                {format(parseISO(appointment.date), "MMM", { locale: it })}
              </span>
              <span className="text-2xl font-bold leading-none mt-1">{format(parseISO(appointment.date), "d")}</span>
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{appointment.clientName}</p>
              <p className="text-sm text-muted-foreground truncate">{appointment.clientEmail}</p>
              <p className="text-xs text-muted-foreground mt-1">{appointment.time}</p>
            </div>
          </div>
          <div className="text-right font-medium">{currency.format(appointment.amount)}</div>
        </div>
      ))}
    </div>
  )
}

