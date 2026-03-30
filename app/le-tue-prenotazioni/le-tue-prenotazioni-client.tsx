"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarDays, Clock, Scissors, User, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useAuth } from "@/components/auth-context"
import { getClientAppointments, clientCancelAppointment } from "@/lib/actions"
import type { Appointment } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"
import { useAppointmentsRealtime } from "@/hooks/use-appointments-realtime"
import { parseAppointmentDateLocal } from "@/lib/appointment-availability"

export function LeTuePrenotazioniClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [showBookedNotice, setShowBookedNotice] = useState(false)

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

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

  const loadClientAppointments = useCallback(async () => {
    if (!user || user.role !== "client") return
    setLoadingAppointments(true)
    try {
      const rows = await getClientAppointments(user.id)
      setAppointments(rows)
    } finally {
      setLoadingAppointments(false)
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    void loadClientAppointments()
  }, [loadClientAppointments])

  useAppointmentsRealtime({
    enabled: Boolean(user && user.role === "client"),
    mode: "client",
    clientId: user?.role === "client" ? user.id : undefined,
    onInvalidate: () => void loadClientAppointments(),
    channelScope: "client-bookings",
  })

  useEffect(() => {
    if (searchParams.get("booked") !== "1") return
    toast({
      title: "Prenotazione completata",
      description: "La tua prenotazione e' stata inviata con successo.",
    })
    setShowBookedNotice(true)
    router.replace("/le-tue-prenotazioni")
  }, [searchParams, router])

  const toAppointmentDateTimeLocal = (a: Appointment): Date => {
    const d = typeof a.date === "string" ? parseAppointmentDateLocal(a.date) : a.date
    const [hh, mm] = String(a.time).slice(0, 5).split(":")
    const hours = Number(hh) || 0
    const minutes = Number(mm) || 0
    const dt = new Date(d)
    dt.setHours(hours, minutes, 0, 0)
    return dt
  }

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const now = new Date()
    const upcoming = appointments
      .filter((a) => toAppointmentDateTimeLocal(a).getTime() > now.getTime())
      .sort((a, b) => toAppointmentDateTimeLocal(a).getTime() - toAppointmentDateTimeLocal(b).getTime())
    const past = appointments
      .filter((a) => !upcoming.some((u) => u.id === a.id))
      .sort((a, b) => toAppointmentDateTimeLocal(b).getTime() - toAppointmentDateTimeLocal(a).getTime())
    return { upcomingAppointments: upcoming, pastAppointments: past }
  }, [appointments])

  const statusLabel = (status: Appointment["status"]) => {
    if (status === "confirmed") return "Confermato"
    if (status === "completed") return "Completato"
    if (status === "cancelled") return "Rifiutato"
    if (status === "pending") return "In attesa"
    return status
  }

  const statusClassName = (status: Appointment["status"]) => {
    if (status === "confirmed") {
      return "bg-emerald-100 text-emerald-900 border-emerald-200"
    }
    if (status === "completed") {
      return "bg-sky-100 text-sky-900 border-sky-200"
    }
    if (status === "cancelled") {
      return "bg-rose-200 text-rose-800 border-rose-300"
    }
    if (status === "pending") {
      return "bg-[hsl(34.3_100%_91.8%)] text-[hsl(15.3_74.6%_27.8%)] border-[hsl(34.3_70%_75%)]"
    }
    return ""
  }

  const canCancel = (a: Appointment) => a.status !== "cancelled"

  const openDetail = (a: Appointment) => {
    setSelectedAppointment(a)
    setShowCancelConfirm(false)
    setDrawerOpen(true)
  }

  const handleCancel = async () => {
    if (!selectedAppointment) return
    setConfirmingCancel(true)
    try {
      const result = await clientCancelAppointment(selectedAppointment.id)
      if (result.success) {
        toast({ title: "Prenotazione annullata", description: result.message })
        setDrawerOpen(false)
        void loadClientAppointments()
      } else {
        toast({ title: "Errore", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Errore", description: "Si e' verificato un errore. Riprova.", variant: "destructive" })
    } finally {
      setConfirmingCancel(false)
      setShowCancelConfirm(false)
    }
  }

  const renderAppointmentRow = (appointment: Appointment, tappable: boolean) => {
    const date =
      typeof appointment.date === "string" ? parseAppointmentDateLocal(appointment.date) : appointment.date
    return (
      <button
        key={appointment.id}
        type="button"
        disabled={!tappable}
        onClick={() => tappable && openDetail(appointment)}
        className="flex w-full items-center justify-between gap-4 border-b pb-4 last:border-0 text-left disabled:cursor-default"
      >
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
        <Badge variant="outline" className={statusClassName(appointment.status)}>
          {statusLabel(appointment.status)}
        </Badge>
      </button>
    )
  }

  const selectedDate = selectedAppointment
    ? typeof selectedAppointment.date === "string"
      ? parseAppointmentDateLocal(selectedAppointment.date)
      : selectedAppointment.date
    : null

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Le Tue Prenotazioni</h1>

      {showBookedNotice && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Prenotazione inserita con successo.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Prossime</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAppointments ? (
            <p className="text-muted-foreground">Caricamento...</p>
          ) : upcomingAppointments.length === 0 ? (
            <p className="text-muted-foreground">Nessuna prenotazione imminente.</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((a) => renderAppointmentRow(a, canCancel(a)))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Effettuate</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAppointments ? (
            <p className="text-muted-foreground">Caricamento...</p>
          ) : pastAppointments.length === 0 ? (
            <p className="text-muted-foreground">Nessuna prenotazione passata.</p>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((a) => renderAppointmentRow(a, false))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="relative">
            <DrawerClose asChild>
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
            <DrawerTitle className="text-lg">Dettaglio prenotazione</DrawerTitle>
            <DrawerDescription>
              {selectedAppointment && (
                <Badge variant="outline" className={statusClassName(selectedAppointment.status)}>
                  {statusLabel(selectedAppointment.status)}
                </Badge>
              )}
            </DrawerDescription>
          </DrawerHeader>

          {selectedAppointment && selectedDate && (
            <div className="px-4 pb-2 space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Scissors className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Servizio</p>
                    <p className="font-medium">{selectedAppointment.serviceName || "Servizio"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Collaboratore</p>
                    <p className="font-medium">{selectedAppointment.resourceName || "Staff"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium capitalize">
                      {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ora</p>
                    <p className="font-medium">{String(selectedAppointment.time).slice(0, 5)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DrawerFooter>
            {selectedAppointment && canCancel(selectedAppointment) && (
              <>
                {!showCancelConfirm ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Annulla prenotazione
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-center text-muted-foreground">
                      Sei sicuro di voler annullare questa prenotazione?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={confirmingCancel}
                      >
                        No, torna indietro
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleCancel}
                        disabled={confirmingCancel}
                      >
                        {confirmingCancel ? "Annullamento..." : "Si, annulla"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full">
                Chiudi
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
