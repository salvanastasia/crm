import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
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

    const body = (await request.json()) as {
      token?: string
      platform?: "ios" | "android" | "web"
    }

    const token = String(body?.token ?? "").trim()
    const platform = body?.platform
    if (!token || !platform || !["ios", "android", "web"].includes(platform)) {
      return NextResponse.json({ error: "Payload non valido" }, { status: 400 })
    }

    const { data: profile } = await supabase.from("profiles").select("barber_id").eq("id", user.id).maybeSingle()
    const barberId = (profile as any)?.barber_id ?? null

    const { error } = await supabase.from("push_devices").upsert(
      {
        user_id: user.id,
        barber_id: barberId,
        token,
        platform,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      } as any,
      { onConflict: "token" },
    )

    if (error) {
      console.error("push/register:", error)
      return NextResponse.json({ error: "Registrazione push fallita" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("push/register:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
