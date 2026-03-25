"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useAuth } from "@/components/auth-context"
import { getRevenueChartSeries } from "@/lib/actions"
import { useAppointmentsRealtime } from "@/hooks/use-appointments-realtime"

export function RevenueChart() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const { user } = useAuth()
  const year = useMemo(() => new Date().getFullYear(), [])
  const defaultData = useMemo(
    () =>
      ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"].map((name) => ({
        name,
        total: 0,
      })),
    [],
  )
  const [data, setData] = useState<Array<{ name: string; total: number }>>(defaultData)

  const loadSeries = useCallback(async () => {
    if (!user?.barberId) return
    try {
      const series = await getRevenueChartSeries(user.barberId, year)
      setData(series)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("RevenueChart:", err)
      setData([])
    }
  }, [user?.barberId, year])

  useEffect(() => {
    void loadSeries()
  }, [loadSeries])

  useAppointmentsRealtime({
    enabled: Boolean(user?.barberId),
    mode: "barber",
    barberId: user?.barberId,
    onInvalidate: () => void loadSeries(),
    channelScope: "dashboard-revenue",
  })

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            stroke={isDark ? "#888888" : "#888888"}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={isDark ? "#888888" : "#888888"}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `€${value}`}
          />
          <Bar dataKey="total" fill={isDark ? "hsl(var(--primary))" : "hsl(var(--primary))"} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

