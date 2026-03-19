"use client"

import { useTheme } from "next-themes"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  { name: "Gen", total: 1800 },
  { name: "Feb", total: 2200 },
  { name: "Mar", total: 2800 },
  { name: "Apr", total: 2400 },
  { name: "Mag", total: 2600 },
  { name: "Giu", total: 3200 },
  { name: "Lug", total: 2900 },
  { name: "Ago", total: 2400 },
  { name: "Set", total: 2800 },
  { name: "Ott", total: 3100 },
  { name: "Nov", total: 2600 },
  { name: "Dic", total: 2200 },
]

export function RevenueChart() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

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

