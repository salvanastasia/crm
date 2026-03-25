"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Notifiche</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === "client" ? "Aggiornamenti sulle tue prenotazioni." : "Aggiornamenti e richieste del salone."}
          </p>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={marking || unreadIds.length === 0}>
          Segna tutte come lette
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Storico</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Caricamento…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nessuna notifica.</div>
          ) : (
            <div className="space-y-3">
              {rows.map((n) => {
                const created = new Date(n.createdAt)
                const ago = formatDistanceToNow(created, { addSuffix: true, locale: it })
                return (
                  <div key={n.id} className="rounded-md border p-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{n.title}</p>
                        {!n.readAt ? (
                          <span className="h-2 w-2 rounded-full bg-destructive shrink-0" aria-label="Non letta" />
                        ) : null}
                      </div>
                      {n.body ? <p className="text-sm text-muted-foreground mt-1">{n.body}</p> : null}
                      <p className="text-xs text-muted-foreground mt-2">{ago}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {n.audience === "barber_staff" ? "Staff" : "Tu"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

