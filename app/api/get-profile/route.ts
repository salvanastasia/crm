import { NextResponse } from "next/server"
import { MockDataStore } from "@/lib/mock-data"

export async function GET() {
  try {
    const store = MockDataStore.getInstance()
    const user = store.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    // Return profile data
    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone || null,
      barber_id: user.barberId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Errore nell'API get-profile:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

