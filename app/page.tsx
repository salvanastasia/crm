"use client"

import { useEffect } from "react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardStats } from "@/components/dashboard-stats"
import { RevenueChart } from "@/components/revenue-chart"
import { RecentAppointments } from "@/components/recent-appointments"
import { useAuth } from "@/components/auth-context"
import { Skeleton } from "@/components/ui/skeleton"

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth()))
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  const rangeStart = new Date(Number(selectedYear), Number(selectedMonth), 1)
  const rangeEnd = new Date(Number(selectedYear), Number(selectedMonth) + 1, 0)
  const startDateKey = format(rangeStart, "yyyy-MM-dd")
  const endDateKey = format(rangeEnd, "yyyy-MM-dd")
  const startLabel = format(rangeStart, "d MMM, yyyy")
  const endLabel = format(rangeEnd, "d MMM, yyyy")
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const weekStartKey = format(weekStart, "yyyy-MM-dd")
  const weekEndKey = format(weekEnd, "yyyy-MM-dd")
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, idx) => ({
        value: String(idx),
        label: format(new Date(2026, idx, 1), "MMMM", { locale: it }),
      })),
    [],
  )
  const yearOptions = useMemo(() => {
    const currentYear = now.getFullYear()
    return Array.from({ length: 7 }).map((_, idx) => String(currentYear - 3 + idx))
  }, [now])

  // Aggiungi reindirizzamento basato sul ruolo utente all'inizio della funzione Dashboard
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user?.role === "client") {
        // Reindirizza i clienti alla pagina di prenotazione
        router.push("/booking")
      } else if (user?.role === "admin" && !user.barberId) {
        router.push("/onboarding")
      }
    }
  }, [isAuthenticated, isLoading, router, user])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Skeleton className="h-10 w-40" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-background rounded-md px-3 py-2">
              <Skeleton className="h-4 w-4" />
              <div className="space-y-2">
                <Skeleton className="h-9 w-[140px] rounded-md" />
                <Skeleton className="h-9 w-[96px] rounded-md" />
              </div>
            </div>
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 overflow-hidden rounded-lg border bg-card">
            <div className="p-6 space-y-6">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="p-6 space-y-4">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role === "client" || (user?.role === "admin" && !user.barberId)) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-background rounded-md px-2 py-1">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-9 w-[140px] border-0 bg-muted/60 px-3 text-sm capitalize shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-9 w-[96px] border-0 bg-muted/60 px-3 text-sm shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <DashboardStats startDateKey={startDateKey} endDateKey={endDateKey} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-6">Panoramica</h3>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Questa settimana</h3>
            <RecentAppointments startDateKey={weekStartKey} endDateKey={weekEndKey} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

