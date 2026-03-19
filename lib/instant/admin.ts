import { init } from "@instantdb/admin"

const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID
const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN

if (!appId) {
  throw new Error("Missing NEXT_PUBLIC_INSTANT_APP_ID")
}

if (!adminToken) {
  throw new Error("Missing INSTANT_APP_ADMIN_TOKEN")
}

export const instantAdmin = init({
  appId,
  adminToken,
})
