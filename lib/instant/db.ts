import { init } from "@instantdb/react"

const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID

if (!appId) {
  throw new Error("Missing NEXT_PUBLIC_INSTANT_APP_ID")
}

export const instantDb = init({ appId })
