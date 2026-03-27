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
  if (!url || !serviceRoleKey) return null

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function sendFcmMessage(token: string, payload: { title: string; body: string; data: Record<string, string> }) {
  const messaging = getFirebaseMessaging()
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
    return { ok: false as const, error: code || "send_failed" }
  }
}

export async function sendPushForInsertedNotifications(rows: NotificationRow[]) {
  if (!rows.length) return
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

