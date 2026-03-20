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

  if (!user?.id) {
    return { ok: false, status: 401, error: "Not authenticated" }
  }

  // Fetch barber_id for current profile (may be null for admins before onboarding).
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, role, barber_id")
    .eq("id", user.id)
    .maybeSingle()

  if (profileErr) {
    return { ok: false, status: 500, error: `profiles select failed: ${profileErr.message}` }
  }

  if (!profile?.barber_id) {
    return { ok: false, status: 400, error: "Current user has no barber_id in profiles" }
  }

  const testId = `test-${user.id}-${Date.now()}`

  const { error: insertErr } = await supabase.from("profiles").insert({
    id: testId,
    name: "Test Client",
    email: "",
    role: "client",
    phone: null,
    barber_id: profile.barber_id,
  })

  if (insertErr) {
    return { ok: false, status: 500, error: insertErr.message }
  }

  // Cleanup: delete the test row best-effort.
  await supabase.from("profiles").delete().eq("id", testId)

  return { ok: true, status: 200, insertedId: testId }
}

export async function POST(_request: NextRequest) {
  const res = await run()
  if (!res.ok) {
    return NextResponse.json({ success: false, error: res.error }, { status: res.status })
  }
  return NextResponse.json({ success: true, insertedId: res.insertedId })
}

export async function GET() {
  // Debug convenience: allow GET to be called directly via browser automation.
  const res = await run()
  if (!res.ok) {
    return NextResponse.json({ success: false, error: res.error }, { status: res.status })
  }
  return NextResponse.json({ success: true, insertedId: res.insertedId })
}

