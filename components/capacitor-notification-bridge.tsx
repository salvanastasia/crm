"use client"

import { useEffect, useRef } from "react"
import { Capacitor } from "@capacitor/core"
import { LocalNotifications } from "@capacitor/local-notifications"
import { useAuth } from "@/components/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/**
 * Capacitor bridge:
 * - listens for new rows in `notifications`
 * - shows native local notification banners on device
 */
export function CapacitorNotificationBridge() {
  const { isAuthenticated, user } = useAuth()
  const shownIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isAuthenticated || !user || !Capacitor.isNativePlatform()) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    let active = true
    let channel: ReturnType<typeof supabase.channel> | null = null

    const canSeeRow = (row: any) => {
      if (user.role === "client") {
        return row?.audience === "user" && row?.recipient_user_id === user.id
      }

      if (!user.barberId) return false
      return row?.audience === "barber_staff" && row?.barber_id === user.barberId
    }

    const notify = async (row: any) => {
      const rowId = String(row?.id ?? "")
      if (!rowId || shownIdsRef.current.has(rowId)) return
      shownIdsRef.current.add(rowId)

      const title = String(row?.title ?? "Nuova notifica")
      const body = String(row?.body ?? "")
      const id = Math.floor(Date.now() % 2_147_483_647)

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title,
              body,
              extra: {
                notificationId: rowId,
                type: String(row?.type ?? ""),
              },
              schedule: { at: new Date(Date.now() + 250) },
            },
          ],
        })
      } catch (error) {
        console.error("CapacitorNotificationBridge.schedule:", error)
      }
    }

    const setup = async () => {
      const perm = await LocalNotifications.requestPermissions()
      if (!active || perm.display !== "granted") return

      channel = supabase
        .channel(`notifications:push:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
          },
          (payload) => {
            const row = payload.new as any
            if (!canSeeRow(row)) return
            void notify(row)
          },
        )
        .subscribe()
    }

    void setup()

    return () => {
      active = false
      if (channel) {
        void supabase.removeChannel(channel)
      }
    }
  }, [isAuthenticated, user?.id, user?.role, user?.barberId])

  return null
}

