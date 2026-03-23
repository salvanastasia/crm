// Appuntamenti di oggi: dati reali da Supabase (non mock)
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCallback, useEffect, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import { useAuth } from "@/components/auth-context"
import { getAppointments, getClientAppointments, updateAppointmentDetailsByAdmin, updateAppointmentStatus } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Appointment } from "@/lib/types"
import { useAppointmentsRealtime } from "@/hooks/use-appointments-realtime"
import { toast } from "@/components/ui/use-toast"

type AppointmentsListProps = {
  selectedDate?: Date
}

export function AppointmentsList({ selectedDate }: AppointmentsListProps) {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editStatus, setEditStatus] = useState<"pending" | "confirmed" | "completed" | "cancelled">("confirmed")

  const selectedDayKey = useMemo(() => format(selectedDate ?? new Date(), "yyyy-MM-dd"), [selectedDate])

  const loadAppointments = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      if (user.role === "client") {
        const rows = await getClientAppointments(user.id)
        setAppointments(rows)
        return
      }

      if (user.barberId) {
        const rows = await getAppointments(user.barberId)
        setAppointments(rows)
        return
      }

      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.role, user?.barberId])

  useEffect(() => {
    void loadAppointments()
  }, [loadAppointments])

  useAppointmentsRealtime({
    enabled: Boolean(user && (user.role === "client" || user.barberId)),
    mode: user?.role === "client" ? "client" : "barber",
    clientId: user?.role === "client" ? user.id : undefined,
    barberId: user?.role !== "client" ? user?.barberId : undefined,
    onInvalidate: () => void loadAppointments(),
    channelScope: "calendar-list",
  })

  const dayAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (!a.date) return false
      const key = typeof a.date === "string" ? a.date : format(a.date, "yyyy-MM-dd")
      return key === selectedDayKey
    })
  }, [appointments, selectedDayKey])

  const canManageAppointments = user?.role === "admin" || user?.role === "staff"

  const normalizeTime = (time: string) => String(time).slice(0, 5)
  const toDate = (value: Date | string) => (typeof value === "string" ? parseISO(value) : value)
  const editingAppointment = appointments.find((a) => a.id === editingId) ?? null

  const handleStatusChange = async (appointmentId: string, status: "confirmed" | "cancelled") => {
    if (!user?.barberId) return
    setUpdatingId(appointmentId)
    try {
      const ok = await updateAppointmentStatus(appointmentId, status, user.barberId)
      if (!ok) return

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status,
              }
            : a,
        ),
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const openEditDialog = (appointment: Appointment) => {
    if (!canManageAppointments) return
    setEditingId(appointment.id)
    setEditDate(format(toDate(appointment.date), "yyyy-MM-dd"))
    setEditTime(normalizeTime(appointment.time))
    setEditStatus(appointment.status)
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!user?.barberId || !editingId || !editDate || !editTime) return
    setUpdatingId(editingId)
    try {
      const res = await updateAppointmentDetailsByAdmin(editingId, user.barberId, {
        date: editDate,
        time: editTime,
        status: editStatus,
      })
      if (!res.ok) {
        toast({
          title: "Impossibile salvare",
          description: res.message ?? "Riprova piu' tardi.",
          variant: "destructive",
        })
        return
      }

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? {
                ...a,
                date: editDate,
                time: editTime,
                status: editStatus,
              }
            : a,
        ),
      )
      setIsEditOpen(false)
      setEditingId(null)
    } finally {
      setUpdatingId(null)
    }
  }

  const statusLabel = (status: Appointment["status"]) => {
    if (status === "confirmed") return "Confermato"
    if (status === "cancelled") return "Rifiutato"
    if (status === "pending") return "In attesa"
    if (status === "completed") return "Completato"
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
    return "bg-zinc-100 text-zinc-800 border-zinc-200"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appuntamenti del Giorno</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Caricamento...</p>
          ) : dayAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground">Nessun appuntamento per il giorno selezionato</p>
          ) : (
            dayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-3"
                onClick={() => openEditDialog(appointment)}
                role={canManageAppointments ? "button" : undefined}
                tabIndex={canManageAppointments ? 0 : -1}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && canManageAppointments) {
                    e.preventDefault()
                    openEditDialog(appointment)
                  }
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-xl bg-zinc-100 text-zinc-800 flex flex-col items-center justify-center shrink-0 border border-zinc-200">
                    <span className="text-xs font-semibold uppercase leading-none">
                      {format(toDate(appointment.date), "MMM", { locale: it })}
                    </span>
                    <span className="text-2xl font-bold leading-none mt-1">{format(toDate(appointment.date), "d")}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{appointment.clientName}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {appointment.serviceName} - {normalizeTime(appointment.time)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canManageAppointments && appointment.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={updatingId === appointment.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(appointment.id, "confirmed")
                        }}
                      >
                        Conferma
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={updatingId === appointment.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(appointment.id, "cancelled")
                        }}
                      >
                        Rifiuta
                      </Button>
                    </>
                  )}
                  <Badge
                    variant="outline"
                    className={statusClassName(appointment.status)}
                  >
                    {statusLabel(appointment.status)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-[440px] px-5 sm:px-6">
          <DialogHeader>
            <DialogTitle>Modifica appuntamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingAppointment ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-zinc-100 text-zinc-800 flex flex-col items-center justify-center shrink-0 border border-zinc-200">
                    <span className="text-xs font-semibold uppercase leading-none">
                      {format(toDate(editingAppointment.date), "MMM", { locale: it })}
                    </span>
                    <span className="text-xl font-bold leading-none mt-1">
                      {format(toDate(editingAppointment.date), "d")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{editingAppointment.clientName}</p>
                    <p className="text-sm text-muted-foreground truncate">{editingAppointment.serviceName}</p>
                  </div>
                </div>
                <Badge variant="outline" className={statusClassName(editingAppointment.status)}>
                  {statusLabel(editingAppointment.status)}
                </Badge>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="edit-date">Data</Label>
              <Input id="edit-date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time">Orario</Label>
              <Input id="edit-time" type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Stato</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as typeof editStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">In attesa</SelectItem>
                  <SelectItem value="confirmed">Confermato</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                  <SelectItem value="cancelled">Rifiutato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editDate || !editTime || !editingId || updatingId === editingId}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

