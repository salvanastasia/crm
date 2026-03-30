import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { sendTestPushToUser } from "@/lib/push"

export const runtime = "nodejs"

export async function POST() {
  try {
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
  } catch (error) {
    console.error("push/test uncaught:", error)
    return NextResponse.json(
      { error: (error as Error)?.message ?? "Internal server error" },
      { status: 500 },
    )
  }
}
