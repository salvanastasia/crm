import { createRouteHandlerClient } from "@/lib/mock-helpers"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Crea un utente admin
    const { data: adminData, error: adminError } = await supabase.auth.signUp({
      email: "admin@barbercrm.com",
      password: "Admin123!",
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
        data: {
          name: "Admin Test",
          role: "admin",
        },
      },
    })

    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 500 })
    }

    // Crea il profilo admin
    const { error: adminProfileError } = await supabase.from("profiles").upsert({
      id: adminData.user.id,
      name: "Admin Test",
      email: "admin@barbercrm.com",
      role: "admin",
    })

    if (adminProfileError) {
      return NextResponse.json({ error: adminProfileError.message }, { status: 500 })
    }

    // Crea un utente cliente
    const { data: clientData, error: clientError } = await supabase.auth.signUp({
      email: "cliente@example.com",
      password: "Cliente123!",
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`,
        data: {
          name: "Cliente Test",
          role: "client",
        },
      },
    })

    if (clientError) {
      return NextResponse.json({ error: clientError.message }, { status: 500 })
    }

    // Crea il profilo cliente
    const { error: clientProfileError } = await supabase.from("profiles").upsert({
      id: clientData.user.id,
      name: "Cliente Test",
      email: "cliente@example.com",
      role: "client",
    })

    if (clientProfileError) {
      return NextResponse.json({ error: clientProfileError.message }, { status: 500 })
    }

    // Conferma manualmente gli utenti (solo per test)
    const { error: confirmAdminError } = await supabase.rpc("confirm_user", {
      user_id: adminData.user.id,
    })

    const { error: confirmClientError } = await supabase.rpc("confirm_user", {
      user_id: clientData.user.id,
    })

    if (confirmAdminError || confirmClientError) {
      return NextResponse.json({
        message: "Utenti creati ma non confermati automaticamente",
        admin: adminData.user,
        client: clientData.user,
        confirmErrors: { admin: confirmAdminError, client: confirmClientError },
      })
    }

    return NextResponse.json({
      message: "Utenti di test creati con successo",
      admin: adminData.user,
      client: clientData.user,
    })
  } catch (error) {
    console.error("Errore durante la creazione degli utenti di test:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

