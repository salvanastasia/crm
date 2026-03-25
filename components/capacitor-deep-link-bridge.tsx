"use client"

import { useEffect } from "react"
import { Capacitor } from "@capacitor/core"

/**
 * Universal link / HTTPS callback che riapre l’app: ricarica la stessa URL nella WebView.
 */
export function CapacitorDeepLinkBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let remove: (() => void) | undefined

    void import("@capacitor/app").then(({ App }) => {
      void App.addListener("appUrlOpen", ({ url: openUrl }) => {
        if (!openUrl) return
        if (openUrl.startsWith("https://") || openUrl.startsWith("http://")) {
          window.location.href = openUrl
        }
      }).then((handle) => {
        remove = () => void handle.remove()
      })
    })

    return () => {
      remove?.()
    }
  }, [])

  return null
}
