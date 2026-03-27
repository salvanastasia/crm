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

  // #region agent log
  fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-permission-debug',hypothesisId:'H8',location:'components/capacitor-push-registration-bridge.tsx:registerDeviceToken',message:'register_device_token_response',data:{ok:response.ok,status:response.status},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (!response.ok) {
    const responseText = await response.text().catch(() => "")
    throw new Error(`push register failed: ${response.status} ${responseText}`.trim())
  }
}

export function CapacitorPushRegistrationBridge() {
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-permission-debug',hypothesisId:'H1',location:'components/capacitor-push-registration-bridge.tsx:useEffect',message:'bridge_effect_enter',data:{isAuthenticated:Boolean(isAuthenticated),hasUserId:Boolean(user?.id),isNativePlatform:Capacitor.isNativePlatform(),platform:Capacitor.getPlatform()},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!isAuthenticated || !user?.id || !Capacitor.isNativePlatform()) return

    let active = true

    const setup = async () => {
      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-permission-debug',hypothesisId:'H2',location:'components/capacitor-push-registration-bridge.tsx:setup',message:'request_permissions_start',data:{active},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const permission = await PushNotifications.requestPermissions()
      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-permission-debug',hypothesisId:'H3',location:'components/capacitor-push-registration-bridge.tsx:setup',message:'request_permissions_result',data:{receive:permission?.receive ?? null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (!active || permission.receive !== "granted") return

      await PushNotifications.removeAllListeners()

      await PushNotifications.addListener("registration", (token: Token) => {
        // #region agent log
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-permission-debug',hypothesisId:'H4',location:'components/capacitor-push-registration-bridge.tsx:registrationListener',message:'registration_token_received',data:{tokenLen:token?.value?.length ?? 0},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (!active) return
        void registerDeviceToken(token.value).catch((error) => {
          console.error("CapacitorPushRegistrationBridge registration:", error)
        })
      })

      await PushNotifications.addListener("registrationError", (error) => {
        // #region agent log
        fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-permission-debug',hypothesisId:'H5',location:'components/capacitor-push-registration-bridge.tsx:registrationErrorListener',message:'registration_error',data:{errorMessage:(error as any)?.message ?? null,errorCode:(error as any)?.code ?? null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        console.error("CapacitorPushRegistrationBridge registrationError:", error)
      })

      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-permission-debug',hypothesisId:'H4',location:'components/capacitor-push-registration-bridge.tsx:setup',message:'push_register_start',data:{active},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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

