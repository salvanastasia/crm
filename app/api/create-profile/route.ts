import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { MockDataStore } from "@/lib/mock-data"

export async function POST(request: NextRequest) {
  try {
    const { id, name, email, role } = await request.json()

    if (!id || !name || !email || !role) {
      return NextResponse.json({ error: "Tutti i campi sono obbligatori" }, { status: 400 })
    }

    const store = MockDataStore.getInstance()

    // Check if user exists
    const existingUser = store.getUserById(id)

    if (existingUser) {
      // Update existing user
      const updated = store.getUserById(id)
      if (updated) {
        updated.name = name
        updated.email = email
        updated.role = role as "admin" | "staff" | "client"
        store.users.set(id, updated)
      }
      return NextResponse.json({ success: true, message: "Profilo aggiornato con successo" })
    }

    // Create new user
    const result = store.signUp(email, "password", name, role as "admin" | "staff" | "client")
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Profilo creato con successo" })
  } catch (error) {
    console.error("Errore nella route create-profile:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

