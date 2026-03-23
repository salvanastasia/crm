 "use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { getRecentAppointmentsForDashboard, updateAppointmentDetailsByAdmin, updateAppointmentStatus } from "@/lib/actions"
import { format, parseISO } from "date-fns"
import { it } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editStatus, setEditStatus] = useState<"pending" | "confirmed" | "completed" | "cancelled">("confirmed")

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
  const editingAppointment = recent.find((a) => a.id === editingId) ?? null

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

  const openEditDialog = (appointment: RecentAppointmentsResponse["recent"][number]) => {
    if (!canManageAppointments) return
    setEditingId(appointment.id)
    setEditDate(appointment.date)
    setEditTime(normalizeTime(appointment.time))
    setEditStatus(appointment.status)
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!user?.barberId || !editingId || !editDate || !editTime) return
    setUpdatingId(editingId)
    try {
      const ok = await updateAppointmentDetailsByAdmin(editingId, user.barberId, {
        date: editDate,
        time: editTime,
        status: editStatus,
      })
      if (!ok) return

      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          recent: prev.recent.map((a) =>
            a.id === editingId
              ? {
                  ...a,
                  date: editDate,
                  time: editTime,
                  status: editStatus,
                }
              : a,
          ),
        }
      })
      setIsEditOpen(false)
      setEditingId(null)
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
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground mb-6">
        {loading ? "Caricamento..." : `Hai ${appointmentsCount} appuntamenti questa settimana.`}
      </p>

      {!loading && recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun appuntamento per questa settimana.</p>
      ) : null}

      {recent.map((appointment) => (
        <div
          key={appointment.id}
          className="flex items-center justify-between gap-4"
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
                  variant="outline"
                  className="bg-rose-200 text-rose-950 border-rose-500 hover:bg-rose-700 hover:text-white dark:bg-rose-800 dark:text-rose-50 dark:border-rose-400 dark:hover:bg-rose-700 dark:hover:text-white"
                  disabled={updatingId === appointment.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange(appointment.id, "cancelled")
                  }}
                >
                  Rifiuta
                </Button>
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
              </>
            )}
            </div>
          </div>
        </div>
      ))}

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
                      {format(parseISO(editingAppointment.date), "MMM", { locale: it })}
                    </span>
                    <span className="text-xl font-bold leading-none mt-1">
                      {format(parseISO(editingAppointment.date), "d")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{editingAppointment.clientName}</p>
                    <p className="text-sm text-muted-foreground truncate">{editingAppointment.clientEmail}</p>
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
    </div>
  )
}

