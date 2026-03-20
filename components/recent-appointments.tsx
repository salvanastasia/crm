 "use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { getRecentAppointmentsForDashboard } from "@/lib/actions"

type RecentAppointmentsResponse = {
  appointmentsCount: number
  recent: Array<{
    id: string
    clientName: string
    clientEmail: string
    initials: string
    amount: number
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
        <div key={appointment.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={undefined} />
              <AvatarFallback>{appointment.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{appointment.clientName}</p>
              <p className="text-sm text-muted-foreground">{appointment.clientEmail}</p>
            </div>
          </div>
          <div className="text-right font-medium">{currency.format(appointment.amount)}</div>
        </div>
      ))}
    </div>
  )
}

