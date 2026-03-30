"use client"

import { useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { PushNotifications, type Token } from "@capacitor/push-notifications"
import { useAuth } from "@/components/auth-context"

async function registerDeviceToken(token: string) {
  const platform = Capacitor.getPlatform()
  const normalizedPlatform = platform === "ios" || platform === "android" ? platform : "web"

  const response = await fetch("/api/push/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token,
      platform: normalizedPlatform,
    }),
  })

  if (!response.ok) {
    const responseText = await response.text().catch(() => "")
    throw new Error(`push register failed: ${response.status} ${responseText}`.trim())
  }
}

export function CapacitorPushRegistrationBridge() {
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !Capacitor.isNativePlatform()) return

    let active = true

    const setup = async () => {
      const permission = await PushNotifications.requestPermissions()
      if (!active || permission.receive !== "granted") return

      await PushNotifications.removeAllListeners()

      await PushNotifications.addListener("registration", (token: Token) => {
        if (!active) return
        void registerDeviceToken(token.value).catch((error) => {
          console.error("CapacitorPushRegistrationBridge registration:", error)
        })
      })

      await PushNotifications.addListener("registrationError", (error) => {
        console.error("CapacitorPushRegistrationBridge registrationError:", error)
      })

      await PushNotifications.register()
    }

    void setup()

    return () => {
      active = false
      void PushNotifications.removeAllListeners()
    }
  }, [isAuthenticated, user?.id])

  return null
}
