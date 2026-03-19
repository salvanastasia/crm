import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getInstantService } from "@/lib/instant/service"

export async function POST(request: NextRequest) {
  try {
    const instantAdmin = getInstantService()

    // Esegui SQL per correggere la policy
    const { error } = await instantAdmin.rpc("fix_profiles_policy")

    if (error) {
      console.error("Errore durante la correzione della policy:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Policy corretta con successo" })
  } catch (error) {
    console.error("Errore nella route fix-profiles-policy:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

