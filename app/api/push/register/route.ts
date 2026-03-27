import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1fc81e'},body:JSON.stringify({sessionId:'1fc81e',runId:'push-register-debug',hypothesisId:'H15',location:'app/api/push/register/route.ts:POST',message:'push_register_endpoint_hit',data:{hasSupabaseUrl:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.error("[PushDebug][H15] push_register_endpoint_hit", {
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    })

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
    console.error("[PushDebug][H16] push_register_payload", {
      hasToken: Boolean(token),
      tokenLen: token.length,
      platform: platform ?? null,
    })
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
      console.error("[PushDebug][H16] push_register_upsert_error", { message: (error as any)?.message ?? null })
      return NextResponse.json({ error: "Registrazione push fallita" }, { status: 500 })
    }

    console.error("[PushDebug][H16] push_register_upsert_ok")

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("push/register:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

