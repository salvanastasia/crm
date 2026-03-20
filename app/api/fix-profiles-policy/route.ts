import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

async function run() {
  const supabase = await createSupabaseServerClient()
  if (!supabase) {
    return { ok: false, status: 500, error: "Supabase server client unavailable" }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, error: "Not authenticated" }
  }

  const { error } = await supabase.rpc("fix_profiles_policy")
  if (error) {
    return { ok: false, status: 500, error: error.message }
  }

  return { ok: true, status: 200, message: "Policy corretta con successo" }
}

export async function POST(_request: NextRequest) {
  try {
    const res = await run()
    if (!res.ok) {
      return NextResponse.json({ success: false, error: res.error }, { status: res.status })
    }
    return NextResponse.json({ success: true, message: res.message })
  } catch (error) {
    console.error("Errore nella route fix-profiles-policy:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function GET() {
  // Debug convenience: allow GET to run the same RPC and return JSON.
  const res = await run()
  if (!res.ok) {
    return NextResponse.json({ success: false, error: res.error }, { status: res.status })
  }
  return NextResponse.json({ success: true, message: res.message })
}

