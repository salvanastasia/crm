import { NextResponse } from "next/server"
import { getFirebaseMessaging } from "@/lib/firebase-admin"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const expected = process.env.PUSH_DIAG_SECRET?.trim()
  const url = new URL(request.url)
  const got = url.searchParams.get("secret")?.trim()
  if (!expected || got !== expected) {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  const shape =
    !raw ? "missing" : raw.startsWith("base64:") ? "base64" : raw[0] === "{" || raw[0] === "[" ? "inline" : "path_or_opaque"

  const messaging = getFirebaseMessaging()

  return NextResponse.json({
    ok: true,
    firebase: {
      serviceAccountShape: shape,
      messagingReady: Boolean(messaging),
    },
  })
}
