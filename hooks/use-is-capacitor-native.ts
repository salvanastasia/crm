"use client"

import { useEffect, useState } from "react"
import { Capacitor } from "@capacitor/core"

/**
 * true quando l’app gira dentro la shell Capacitor (iOS/Android).
 * Sul server e sul primo paint web resta false, poi si aggiorna lato client.
 */
export function useIsCapacitorNative(): boolean {
  const [native, setNative] = useState(() =>
    typeof window !== "undefined" ? Capacitor.isNativePlatform() : false,
  )

  useEffect(() => {
    setNative(Capacitor.isNativePlatform())
  }, [])

  return native
}
