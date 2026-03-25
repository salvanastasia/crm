"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Calendar, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import {
  autoRejectExpiredPendingAppointments,
  getClientStatusChangeAppointments,
  getBrandSettings,
  getPendingAppointmentsCount,
  getPendingAppointmentsForApprovals,
  updateAppointmentStatus,
} from "@/lib/actions"
import { useAuth } from "@/components/auth-context"
import type { Appointment, BrandSettings } from "@/lib/types"
import { useAppointmentsRealtime } from "@/hooks/use-appointments-realtime"
import { parseAppointmentDateLocal } from "@/lib/appointment-availability"
import { staffNavItems } from "@/lib/mobile-nav"
import { useIsCapacitorNative } from "@/hooks/use-is-capacitor-native"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [settings, setSettings] = useState<BrandSettings | null>(null)
  const { user, isAuthenticated, logout } = useAuth()
  const isCapacitorNative = useIsCapacitorNative()

  const isStaff = user && (user.role === "admin" || user.role === "staff")
  const isClient = user?.role === "client"

  const isClientBookingFlow = isClient && pathname.startsWith("/booking")

  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)
  const [pendingApprovals, setPendingApprovals] = useState<Appointment[]>([])
  const [pendingApprovalsLoading, setPendingApprovalsLoading] = useState(false)
  const [pendingApprovalsUpdatingId, setPendingApprovalsUpdatingId] = useState<string | null>(null)
  const skipRealtimeUntilRef = useRef<number>(0)
  const lastAutoRejectAtRef = useRef<number>(0)

  const APPROVALS_LIMIT = 5

  const [clientNotifOpen, setClientNotifOpen] = useState(false)
  const [clientNotifications, setClientNotifications] = useState<Appointment[]>([])
  const [clientNotificationsLoading, setClientNotificationsLoading] = useState(false)
  const [clientNotifSeenAt, setClientNotifSeenAt] = useState<number>(0)
  const skipClientRealtimeUntilRef = useRef<number>(0)
  const prevClientNotifOpenRef = useRef<boolean>(false)
  const CLIENT_NOTIF_SEEN_AT_KEY = user?.id ? `client:notif-seen-at:${user.id}` : null

  const loadClientNotifications = useCallback(async () => {
    if (!isClient || !user?.id) return
    setClientNotificationsLoading(true)
    try {
      const rows = await getClientStatusChangeAppointments(user.id, 5)
      setClientNotifications(rows)
    } finally {
      setClientNotificationsLoading(false)
    }
  }, [isClient, user?.id])

  const maybeAutoRejectExpiredPending = useCallback(async () => {
    if (!isStaff || !user?.barberId) return
    const now = Date.now()
    if (now - lastAutoRejectAtRef.current < 60_000) return
    lastAutoRejectAtRef.current = now

    // Avoid dropdown flicker: realtime may revalidate after bulk update.
    skipRealtimeUntilRef.current = now + 2000
    await autoRejectExpiredPendingAppointments(user.barberId)
  }, [isStaff, user?.barberId])

  const loadPendingApprovalsCount = useCallback(async () => {
    if (!isStaff || !user?.barberId) {
      setPendingApprovalsCount(0)
      return
    }
    await maybeAutoRejectExpiredPending()
    const count = await getPendingAppointmentsCount(user.barberId)
    setPendingApprovalsCount(count)
  }, [isStaff, user?.barberId, maybeAutoRejectExpiredPending])

  useEffect(() => {
    void loadPendingApprovalsCount()
  }, [loadPendingApprovalsCount])

  const loadPendingApprovals = useCallback(async () => {
    if (!isStaff || !user?.barberId) {
      setPendingApprovals([])
      return
    }
    setPendingApprovalsLoading(true)
    try {
      await maybeAutoRejectExpiredPending()
      const rows = await getPendingAppointmentsForApprovals(user.barberId, APPROVALS_LIMIT)
      setPendingApprovals(rows)
    } finally {
      setPendingApprovalsLoading(false)
    }
  }, [isStaff, user?.barberId, maybeAutoRejectExpiredPending])

  useEffect(() => {
    void loadPendingApprovals()
  }, [loadPendingApprovals])

  useAppointmentsRealtime({
    enabled: Boolean(isAuthenticated && isStaff && user?.barberId),
    mode: "barber",
    barberId: isStaff ? user?.barberId : undefined,
    onInvalidate: () => {
      // Avoid dropdown flicker: after a manual approve/reject we already update the UI optimistically.
      // We'll let realtime refetch after a short grace period.
      if (Date.now() < skipRealtimeUntilRef.current) return
      void loadPendingApprovalsCount()
      void loadPendingApprovals()
    },
    channelScope: "pending-approvals",
  })

  useEffect(() => {
    if (!isClient || !user?.id || !CLIENT_NOTIF_SEEN_AT_KEY) return
    const raw = window.localStorage.getItem(CLIENT_NOTIF_SEEN_AT_KEY)
    const parsed = raw ? Number(raw) : 0
    setClientNotifSeenAt(Number.isFinite(parsed) ? parsed : 0)
  }, [isClient, user?.id, CLIENT_NOTIF_SEEN_AT_KEY])

  useEffect(() => {
    if (!isClient) return
    void loadClientNotifications()
  }, [isClient, loadClientNotifications])

  useAppointmentsRealtime({
    enabled: Boolean(isAuthenticated && isClient && user?.id),
    mode: "client",
    clientId: user?.id,
    onInvalidate: () => {
      if (Date.now() < skipClientRealtimeUntilRef.current) return
      void loadClientNotifications()
    },
    channelScope: "client-status-notifications",
  })

  useEffect(() => {
    if (!CLIENT_NOTIF_SEEN_AT_KEY) return
    // Mark as read when user closes the dropdown (so the list is visible while open).
    if (prevClientNotifOpenRef.current && !clientNotifOpen) {
      const now = Date.now()
      window.localStorage.setItem(CLIENT_NOTIF_SEEN_AT_KEY, String(now))
      setClientNotifSeenAt(now)
      skipClientRealtimeUntilRef.current = now + 2000
    }
    prevClientNotifOpenRef.current = clientNotifOpen
  }, [clientNotifOpen, CLIENT_NOTIF_SEEN_AT_KEY])

  const clientNotificationsUnread = clientNotifications.filter((a) => {
    const updatedMs = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    return a.status !== "pending" && updatedMs > clientNotifSeenAt
  })

  useEffect(() => {
    const loadSettings = async () => {
      const barberId = user?.barberId
      const data = barberId ? await getBrandSettings(barberId) : null
      setSettings(data)
    }

    void loadSettings()

    const handleSettingsUpdate = (e: CustomEvent<BrandSettings>) => {
      setSettings(e.detail)
    }

    window.addEventListener("brandSettingsUpdated", handleSettingsUpdate as EventListener)

    return () => {
      window.removeEventListener("brandSettingsUpdated", handleSettingsUpdate as EventListener)
    }
  }, [user?.barberId])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const brandLabel = settings?.businessName || "Barber CRM"

  /** Client booking: solo logo, tema, utente — niente CRM */
  if (isAuthenticated && isClientBookingFlow) {
    return (
      <header className="border-b bg-background">
        <div className="max-w-3xl mx-auto w-full px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/booking" className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={settings?.logoUrl || "/placeholder.svg?height=32&width=32"} alt="" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold truncate">{brandLabel}</span>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated && isClient && (
                <DropdownMenu open={clientNotifOpen} onOpenChange={setClientNotifOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifiche">
                      <Bell className="h-4 w-4" />
                      {clientNotificationsUnread.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[420px]" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span>Notifiche prenotazioni</span>
                        {clientNotificationsUnread.length > 0 ? (
                          <span className="text-xs text-muted-foreground">{clientNotificationsUnread.length}</span>
                        ) : null}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {clientNotificationsUnread.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">Nessun aggiornamento nuovo</div>
                    ) : (
                      <div className="space-y-2 p-2">
                        {clientNotificationsUnread.slice(0, 5).map((a) => {
                          const date = typeof a.date === "string" ? parseAppointmentDateLocal(a.date) : a.date
                          const statusText = a.status === "confirmed" ? "Confermato" : a.status === "cancelled" ? "Rifiutato" : a.status
                          return (
                            <div key={a.id} className="rounded-md border p-2 space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{a.serviceName || "Servizio"}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {a.resourceName || "Staff"} • {String(a.time).slice(0, 5)}
                                  </p>
                                </div>
                                <Badge variant="outline" className={a.status === "confirmed" ? "bg-emerald-100 text-emerald-900 border-emerald-200" : "bg-rose-200 text-rose-800 border-rose-300"}>
                                  {statusText}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Aggiornato il{" "}
                                {a.updatedAt ? format(new Date(a.updatedAt), "d MMM yyyy") : format(date, "d MMM yyyy")}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarUrl || "/placeholder.svg?height=32&width=32"} alt="" />
                      <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tema</span>
                    <ModeToggle className="h-8 w-8" />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/booking" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Prenota
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/le-tue-prenotazioni" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Le Tue Prenotazioni
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/impostazioni" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profilo
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={isStaff ? "/dashboard" : isClient ? "/booking" : "/"} className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={settings?.logoUrl || "/placeholder.svg?height=32&width=32"} alt="Logo" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold">{brandLabel}</span>
            </Link>

            {isAuthenticated && isStaff && !isCapacitorNative && (
              <nav className="hidden md:flex items-center space-x-4">
                {staffNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 text-sm transition-colors hover:text-primary",
                      pathname === item.href ? "text-primary font-medium" : "text-muted-foreground",
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && isClient && (
              <DropdownMenu open={clientNotifOpen} onOpenChange={setClientNotifOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifiche">
                    <Bell className="h-4 w-4" />
                    {clientNotificationsUnread.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[420px]" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span>Notifiche prenotazioni</span>
                      {clientNotificationsUnread.length > 0 ? (
                        <span className="text-xs text-muted-foreground">{clientNotificationsUnread.length}</span>
                      ) : null}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {clientNotificationsLoading ? (
                    <div className="p-3 text-sm text-muted-foreground">Caricamento...</div>
                  ) : clientNotificationsUnread.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">Nessun aggiornamento nuovo</div>
                  ) : (
                    <div className="space-y-2 p-2">
                      {clientNotificationsUnread.slice(0, 5).map((a) => {
                        const statusText = a.status === "confirmed" ? "Confermato" : a.status === "cancelled" ? "Rifiutato" : a.status
                        const date =
                          typeof a.date === "string" ? parseAppointmentDateLocal(a.date) : a.date
                        return (
                          <div key={a.id} className="rounded-md border p-2 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{a.serviceName || "Servizio"}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {a.resourceName || "Staff"} • {String(a.time).slice(0, 5)}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  a.status === "confirmed"
                                    ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                                    : "bg-rose-200 text-rose-800 border-rose-300"
                                }
                              >
                                {statusText}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Aggiornato il{" "}
                              {a.updatedAt ? format(new Date(a.updatedAt), "d MMM yyyy") : format(date, "d MMM yyyy")}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/notifiche">Vedi tutte</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isAuthenticated && isStaff && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Richieste in attesa">
                    <Bell className="h-4 w-4" />
                    {pendingApprovalsCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[420px]" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span>Richieste in attesa</span>
                      {pendingApprovalsCount > 0 ? (
                        <span className="text-xs text-muted-foreground">{pendingApprovalsCount}</span>
                      ) : null}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {pendingApprovalsLoading ? (
                    <div className="p-3 text-sm text-muted-foreground">Caricamento...</div>
                  ) : pendingApprovals.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">Nessuna richiesta pending</div>
                  ) : (
                    <div className="space-y-2 p-2">
                      {pendingApprovals.map((a) => (
                        <div key={a.id} className="rounded-md border p-2 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{a.clientName}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {a.serviceName || "Servizio"} • {a.resourceName || "Staff"}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-medium">
                                {format(parseAppointmentDateLocal(a.date), "d MMM", { locale: it })}
                              </p>
                              <p className="text-xs text-muted-foreground">{String(a.time).slice(0, 5)}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-auto py-1 bg-rose-200 text-rose-950 border-rose-500 hover:bg-rose-700 hover:text-white dark:bg-rose-800 dark:text-rose-50 dark:border-rose-400 dark:hover:bg-rose-700"
                              disabled={pendingApprovalsUpdatingId === a.id}
                              onClick={async (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (!user?.barberId) return
                                setPendingApprovalsUpdatingId(a.id)
                                try {
                                  const ok = await updateAppointmentStatus(a.id, "cancelled", user.barberId)
                                  if (ok) {
                                    // Optimistic update: keep the dropdown stable (no list refresh).
                                    setPendingApprovals((prev) => prev.filter((x) => x.id !== a.id))
                                    setPendingApprovalsCount((prev) => Math.max(0, prev - 1))
                                    skipRealtimeUntilRef.current = Date.now() + 1800
                                  }
                                } finally {
                                  setPendingApprovalsUpdatingId(null)
                                }
                              }}
                            >
                              Rifiuta
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 h-auto py-1"
                              disabled={pendingApprovalsUpdatingId === a.id}
                              onClick={async (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (!user?.barberId) return
                                setPendingApprovalsUpdatingId(a.id)
                                try {
                                  const ok = await updateAppointmentStatus(a.id, "confirmed", user.barberId)
                                  if (ok) {
                                    // Optimistic update: keep the dropdown stable (no list refresh).
                                    setPendingApprovals((prev) => prev.filter((x) => x.id !== a.id))
                                    setPendingApprovalsCount((prev) => Math.max(0, prev - 1))
                                    skipRealtimeUntilRef.current = Date.now() + 1800
                                  }
                                } finally {
                                  setPendingApprovalsUpdatingId(null)
                                }
                              }}
                            >
                              Conferma
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/notifiche">Vedi tutte</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarUrl || "/placeholder.svg?height=32&width=32"} alt="Avatar" />
                      <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tema</span>
                    <ModeToggle className="h-8 w-8" />
                  </div>
                  <DropdownMenuSeparator />
                  {isClient && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/booking">Prenota</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/le-tue-prenotazioni">Le Tue Prenotazioni</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/impostazioni">Profilo</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {isStaff && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/impostazioni" className="w-full">
                          Impostazioni
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" asChild>
                <Link href="/login">Accedi</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
