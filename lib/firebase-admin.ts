import { existsSync, readFileSync } from "node:fs"
import { App, cert, getApps, initializeApp } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"

let app: App | null = null

function resolveFirebaseServiceAccountJson(): string | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null
  if (raw.startsWith("base64:")) {
    try {
      return Buffer.from(raw.slice("base64:".length).trim(), "base64").toString("utf8")
    } catch {
      return null
    }
  }
  const c = raw[0]
  if (c === "{" || c === "[") return raw
  try {
    if (existsSync(raw)) return readFileSync(raw, "utf8")
  } catch {
    // ignore
  }
  return raw
}

function normalizeServiceAccountParsed(parsed: {
  project_id?: string
  client_email?: string
  private_key?: string
}) {
  const k = parsed.private_key
  if (!k) return
  if (k.includes("\\n")) {
    parsed.private_key = k.replace(/\\n/g, "\n")
  }
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
      console.error("getFirebaseApp JSON.parse:", e)
      return null
    }

    normalizeServiceAccountParsed(parsed)

    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      console.warn("FIREBASE_SERVICE_ACCOUNT_JSON invalid: push disabled")
      return null
    }

    try {
      app = initializeApp({
        credential: cert({
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key,
        }),
      })
    } catch (certErr) {
      console.error("getFirebaseApp cert:", certErr)
      return null
    }

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
