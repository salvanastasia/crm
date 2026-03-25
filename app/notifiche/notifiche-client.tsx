"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-context"
import { getMyNotifications, markNotificationsRead } from "@/lib/actions"
import type { Notification } from "@/lib/types"

export function NotificheClient() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [rows, setRows] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMyNotifications({ limit: 50, offset: 0 })
      setRows(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }
    void load()
  }, [isLoading, isAuthenticated, router, load])

  const unreadIds = useMemo(() => rows.filter((n) => !n.readAt).map((n) => n.id), [rows])

  const markAllRead = async () => {
    if (unreadIds.length === 0) return
    setMarking(true)
    try {
      const ok = await markNotificationsRead(unreadIds)
      if (ok) {
        setRows((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })))
      }
    } finally {
      setMarking(false)
    }
  }

  if (!user) return null

  return (
    <div className="w-full space-y-6">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">Notifiche</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === "client" ? "Aggiornamenti sulle tue prenotazioni." : "Aggiornamenti e richieste del salone."}
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full shrink-0 sm:w-auto"
          onClick={markAllRead}
          disabled={marking || unreadIds.length === 0}
        >
          Segna tutte come lette
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Caricamento…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna notifica.</p>
      ) : (
        <ul className="w-full divide-y divide-border">
          {rows.map((n) => {
            const created = new Date(n.createdAt)
            const ago = formatDistanceToNow(created, { addSuffix: true, locale: it })
            return (
              <li key={n.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{n.title}</p>
                    {!n.readAt ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" aria-label="Non letta" />
                    ) : null}
                  </div>
                  {n.body ? <p className="mt-1 text-sm text-muted-foreground">{n.body}</p> : null}
                  <p className="mt-2 text-xs text-muted-foreground">{ago}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {n.audience === "barber_staff" ? "Staff" : "Tu"}
                </Badge>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
