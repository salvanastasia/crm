import { existsSync, readFileSync } from "node:fs"
import { App, cert, getApps, initializeApp } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"

let app: App | null = null

/** Env may be inline JSON (Vercel) or absolute path to the key file (common locally). */
function resolveFirebaseServiceAccountJson(): string | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null
  const c = raw[0]
  if (c === "{" || c === "[") return raw
  try {
    if (existsSync(raw)) return readFileSync(raw, "utf8")
  } catch {
    // ignore
  }
  console.error("[PushDebug][H33] firebase_service_account_path_not_readable", {
    pathLooksAbsolute: raw.startsWith("/"),
  })
  return raw
}

function getFirebaseApp(): App | null {
  if (app) return app

  try {
    if (getApps().length > 0) {
      app = getApps()[0]!
      return app
    }

    const jsonStr = resolveFirebaseServiceAccountJson()
    if (!jsonStr) {
      console.warn("FIREBASE_SERVICE_ACCOUNT_JSON missing: push disabled")
      return null
    }

    let parsed: { project_id?: string; client_email?: string; private_key?: string }
    try {
      parsed = JSON.parse(jsonStr) as typeof parsed
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'post-fix',hypothesisId:'H31',location:'lib/firebase-admin.ts:getFirebaseApp',message:'firebase_service_account_json_parse_failed',data:{hint:'Set FIREBASE_SERVICE_ACCOUNT_JSON to full JSON on Vercel, or a readable file path locally'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      console.error("[PushDebug][H31] firebase_service_account_json_parse_failed", {
        hint: "Use pasted JSON in Vercel env, or a valid absolute path to the .json file locally",
      })
      console.error("getFirebaseApp JSON.parse:", e)
      return null
    }

    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      console.warn("FIREBASE_SERVICE_ACCOUNT_JSON invalid: push disabled")
      return null
    }

    app = initializeApp({
      credential: cert({
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      }),
    })

    console.error("[PushDebug][H32] firebase_admin_init_ok", {
      projectId: parsed.project_id,
    })

    return app
  } catch (error) {
    console.error("getFirebaseApp:", error)
    return null
  }
}

export function getFirebaseMessaging() {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null
  return getMessaging(firebaseApp)
}

