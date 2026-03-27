import { createClient } from "@supabase/supabase-js"
import { getFirebaseMessaging } from "@/lib/firebase-admin"

type NotificationRow = {
  id: string
  barber_id: string | null
  recipient_user_id: string | null
  audience: "user" | "barber_staff"
  type: string
  title: string
  body: string | null
  data: Record<string, unknown> | null
}

type PushDeviceRow = {
  id: string
  user_id: string
  token: string
  platform: "ios" | "android" | "web"
}

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  // #region agent log
  fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-delivery-debug',hypothesisId:'H9',location:'lib/push.ts:adminSupabase',message:'admin_supabase_env_check',data:{hasUrl:Boolean(url),hasServiceRoleKey:Boolean(serviceRoleKey)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  console.error("[PushDebug][H9] admin_supabase_env_check", {
    hasUrl: Boolean(url),
    hasServiceRoleKey: Boolean(serviceRoleKey),
  })
  if (!url || !serviceRoleKey) return null

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function sendFcmMessage(token: string, payload: { title: string; body: string; data: Record<string, string> }) {
  const messaging = getFirebaseMessaging()
  // #region agent log
  fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-delivery-debug',hypothesisId:'H10',location:'lib/push.ts:sendFcmMessage',message:'firebase_messaging_availability',data:{hasMessaging:Boolean(messaging),tokenLen:token.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  console.error("[PushDebug][H10] firebase_messaging_availability", {
    hasMessaging: Boolean(messaging),
    tokenLen: token.length,
  })
  if (!messaging) return { ok: false as const, error: "FIREBASE_SERVICE_ACCOUNT_JSON missing" }

  try {
    await messaging.send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    })
    return { ok: true as const }
  } catch (error) {
    const code = (error as { code?: string } | null)?.code ?? ""
    // #region agent log
    fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-delivery-debug',hypothesisId:'H11',location:'lib/push.ts:sendFcmMessage',message:'firebase_send_error',data:{errorCode:code || null,errorMessage:(error as any)?.message ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.error("[PushDebug][H11] firebase_send_error", {
      errorCode: code || null,
      errorMessage: (error as any)?.message ?? null,
    })
    return { ok: false as const, error: code || "send_failed" }
  }
}

export async function sendPushForInsertedNotifications(rows: NotificationRow[]) {
  if (!rows.length) return
  // #region agent log
  fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-delivery-debug',hypothesisId:'H12',location:'lib/push.ts:sendPushForInsertedNotifications',message:'send_push_start',data:{rowsCount:rows.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  console.error("[PushDebug][H12] send_push_start", { rowsCount: rows.length })
  const supabase = adminSupabase()
  if (!supabase) return

  for (const row of rows) {
    try {
      let recipientIds: string[] = []

      if (row.audience === "user" && row.recipient_user_id) {
        recipientIds = [row.recipient_user_id]
      } else if (row.audience === "barber_staff" && row.barber_id) {
        const { data: staffRows } = await supabase
          .from("profiles")
          .select("id")
          .eq("barber_id", row.barber_id)
          .in("role", ["admin", "staff"])
        recipientIds = (staffRows ?? []).map((r) => String((r as any).id)).filter(Boolean)
      }

      if (!recipientIds.length) continue

      const { data: devices } = await supabase
        .from("push_devices")
        .select("id, user_id, token, platform")
        .in("user_id", recipientIds)
        .eq("is_active", true)

      const deviceRows = (devices ?? []) as PushDeviceRow[]
      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-delivery-debug',hypothesisId:'H13',location:'lib/push.ts:sendPushForInsertedNotifications',message:'push_recipients_devices_resolved',data:{recipientIdsCount:recipientIds.length,deviceRowsCount:deviceRows.length,audience:row.audience},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      console.error("[PushDebug][H13] push_recipients_devices_resolved", {
        recipientIdsCount: recipientIds.length,
        deviceRowsCount: deviceRows.length,
        audience: row.audience,
      })
      if (!deviceRows.length) continue

      const baseData: Record<string, string> = {
        notificationId: row.id,
        type: row.type,
        audience: row.audience,
      }

      const extraData = row.data ?? {}
      for (const [k, v] of Object.entries(extraData)) {
        if (v == null) continue
        baseData[k] = typeof v === "string" ? v : JSON.stringify(v)
      }

      for (const device of deviceRows) {
        const sendResult = await sendFcmMessage(device.token, {
          title: row.title,
          body: row.body ?? "",
          data: {
            ...baseData,
            devicePlatform: device.platform,
          },
        })

        // FCM token is stale or invalid: deactivate so we avoid repeated failures.
        if (
          !sendResult.ok &&
          (sendResult.error === "messaging/registration-token-not-registered" ||
            sendResult.error === "messaging/invalid-registration-token")
        ) {
          await supabase.from("push_devices").update({ is_active: false }).eq("id", device.id)
        }
      }
    } catch (error) {
      console.error("sendPushForInsertedNotifications:", error)
    }
  }
}

