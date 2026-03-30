import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { sendTestPushToUser } from "@/lib/push"

export const runtime = "nodejs"

export async function POST() {
  const supabase = await createSupabaseServerClient()
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 500 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }

  const result = await sendTestPushToUser(user.id)
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}
