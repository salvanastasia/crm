"use client"

import { useEffect, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type AppointmentsRealtimeMode = "barber" | "client"

export type UseAppointmentsRealtimeOptions = {
  /** When false, no subscription is created. */
  enabled?: boolean
  mode: AppointmentsRealtimeMode
  barberId?: string | null
  clientId?: string | null
  /** Called (debounced) after relevant DB changes. Typically refetch server actions. */
  onInvalidate: () => void
  debounceMs?: number
  /** Unique suffix so multiple hooks for the same shop don't share a channel name. */
  channelScope?: string
}

/**
 * Subscribes to Supabase Realtime postgres_changes on `public.appointments`.
 * Requires the table to be in publication `supabase_realtime` (see migrations).
 */
export function useAppointmentsRealtime(options: UseAppointmentsRealtimeOptions) {
  const {
    enabled = true,
    mode,
    barberId,
    clientId,
    onInvalidate,
    debounceMs = 400,
    channelScope = "default",
  } = options

  const onInvalidateRef = useRef(onInvalidate)
  onInvalidateRef.current = onInvalidate

  useEffect(() => {
    if (!enabled) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const filter =
      mode === "barber" && barberId
        ? `barber_id=eq.${barberId}`
        : mode === "client" && clientId
          ? `client_id=eq.${clientId}`
          : null

    if (!filter) return

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const scheduleInvalidate = () => {
      if (timeoutId !== null) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        timeoutId = null
        onInvalidateRef.current()
      }, debounceMs)
    }

    const channelName = `appointments:${mode}:${barberId ?? clientId}:${channelScope}`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter,
        },
        scheduleInvalidate,
      )
      .subscribe()

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      void supabase.removeChannel(channel)
    }
  }, [enabled, mode, barberId, clientId, debounceMs, channelScope])
}
