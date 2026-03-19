import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createRouteHandlerClient } from "@/lib/mock-helpers"
import { cookies } from "next/headers"
import { getInstantService } from "@/lib/instant/service"

export async function GET(request: NextRequest) {
  try {
    // Ottieni l'ID utente dalla query
    const userId = request.nextUrl.searchParams.get("userId")

    // Se non c'è userId, prova a ottenere l'utente dalla sessione
    if (!userId) {
      // Ottieni il client standard per verificare l'autenticazione
      const supabase = createRouteHandlerClient({ cookies })

      // Verifica se l'utente è autenticato
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
      }

      // Usa l'ID utente dalla sessione
      const userIdFromSession = session.user.id

      // Usa il client di servizio per bypassare RLS
      const serviceClient = getInstantService()
      const { data, error } = await serviceClient.from("profiles").select("*").eq("id", userIdFromSession).single()

      if (error) {
        console.error("Errore nel recupero del profilo:", error)

        // Restituisci i dati dell'utente dalla sessione come fallback
        return NextResponse.json({
          id: userIdFromSession,
          email: session.user.email,
          name: session.user.user_metadata?.name || "Utente",
          role: session.user.user_metadata?.role || "client",
        })
      }

      return NextResponse.json(data)
    }

    // Se c'è userId, usa quello
    const serviceClient = getInstantService()
    const { data, error } = await serviceClient.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Errore nel recupero del profilo:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Profilo non trovato" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Errore nella route get-profile-direct:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

