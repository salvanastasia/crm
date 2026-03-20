"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CalendarIcon, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardStats } from "@/components/dashboard-stats"
import { DashboardTabs } from "@/components/dashboard-tabs"
import { RevenueChart } from "@/components/revenue-chart"
import { RecentAppointments } from "@/components/recent-appointments"
import { useAuth } from "@/components/auth-context"

export default function Dashboard() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

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
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-1.5">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">1 Mar, 2025 - 31 Mar, 2025</span>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <DashboardTabs />

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-6">Panoramica</h3>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Appuntamenti Recenti</h3>
            <p className="text-sm text-muted-foreground mb-6">Hai 12 appuntamenti questo mese.</p>
            <RecentAppointments />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

