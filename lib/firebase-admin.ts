import { App, cert, getApps, initializeApp } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"

let app: App | null = null

function getFirebaseApp(): App | null {
  if (app) return app

  try {
    if (getApps().length > 0) {
      app = getApps()[0]!
      return app
    }

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    if (!raw) {
      console.warn("FIREBASE_SERVICE_ACCOUNT_JSON missing: push disabled")
      return null
    }

    const parsed = JSON.parse(raw) as {
      project_id?: string
      client_email?: string
      private_key?: string
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

