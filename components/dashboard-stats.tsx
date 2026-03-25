"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Scissors, Users, Activity } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { getDashboardStats } from "@/lib/actions"
import { useAppointmentsRealtime } from "@/hooks/use-appointments-realtime"

type DashboardStatsResponse = {
  incassoTotal: number
  appointmentsCount: number
  servicesSoldCount: number
  activeClientsCount: number
  incassoChangePct: number
  appointmentsChangePct: number
  servicesSoldChangePct: number
  activeClientsChangePct: number
}

export function DashboardStats({ startDateKey, endDateKey }: { startDateKey: string; endDateKey: string }) {
  const { user } = useAuth()

  const [data, setData] = useState<DashboardStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const currency = useMemo(
    () => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }),
    [],
  )

  const formatSignedPct = (pct: number) => {
    const sign = pct >= 0 ? "+" : ""
    return `${sign}${pct.toFixed(1)}%`
  }

  const loadStats = useCallback(async () => {
    if (!user?.barberId) return
    setLoading(true)
    try {
      const res = await getDashboardStats(user.barberId, startDateKey, endDateKey)
      setData(res)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("DashboardStats:", err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [user?.barberId, startDateKey, endDateKey])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  // Auto-refresh on appointment INSERT/UPDATE/DELETE (status changes included).
  useAppointmentsRealtime({
    enabled: Boolean(user?.barberId),
    mode: "barber",
    barberId: user?.barberId,
    onInvalidate: () => void loadStats(),
    channelScope: "dashboard-stats",
  })

  const stats = data
    ? [
        {
          title: "Incasso Totale",
          value: currency.format(data.incassoTotal),
          change: `${formatSignedPct(data.incassoChangePct)} rispetto al mese scorso`,
          icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
          iconBg: "bg-primary/5 dark:bg-primary/10",
        },
        {
          title: "Appuntamenti",
          value: `+${data.appointmentsCount}`,
          change: `${formatSignedPct(data.appointmentsChangePct)} rispetto al mese scorso`,
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          iconBg: "bg-blue-500/5 dark:bg-blue-500/10",
        },
        {
          title: "Servizi Venduti",
          value: `+${data.servicesSoldCount}`,
          change: `${formatSignedPct(data.servicesSoldChangePct)} rispetto al mese scorso`,
          icon: <Scissors className="h-4 w-4 text-muted-foreground" />,
          iconBg: "bg-green-500/5 dark:bg-green-500/10",
        },
        {
          title: "Clienti Attivi",
          value: `+${data.activeClientsCount}`,
          change: `${formatSignedPct(data.activeClientsChangePct)} rispetto al mese scorso`,
          icon: <Activity className="h-4 w-4 text-muted-foreground" />,
          iconBg: "bg-yellow-500/5 dark:bg-yellow-500/10",
        },
      ]
    : [
        {
          title: "Incasso Totale",
          value: loading ? "—" : currency.format(0),
          change: "",
          icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
          iconBg: "bg-primary/5 dark:bg-primary/10",
        },
        {
          title: "Appuntamenti",
          value: loading ? "—" : "+0",
          change: "",
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          iconBg: "bg-blue-500/5 dark:bg-blue-500/10",
        },
        {
          title: "Servizi Venduti",
          value: loading ? "—" : "+0",
          change: "",
          icon: <Scissors className="h-4 w-4 text-muted-foreground" />,
          iconBg: "bg-green-500/5 dark:bg-green-500/10",
        },
        {
          title: "Clienti Attivi",
          value: loading ? "—" : "+0",
          change: "",
          icon: <Activity className="h-4 w-4 text-muted-foreground" />,
          iconBg: "bg-yellow-500/5 dark:bg-yellow-500/10",
        },
      ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <div className={`rounded-full p-2 ${stat.iconBg}`}>{stat.icon}</div>
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
            {stat.change ? <p className="text-xs text-muted-foreground mt-1">{stat.change}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

