"use server"

import { MockDataStore } from "./mock-data"
import type { User, StaffMember } from "./types"

export async function signUp(userData: {
  email: string
  password: string
  name: string
  role: "client"
}): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const store = MockDataStore.getInstance()
    const result = store.signUp(userData.email, userData.password, userData.name, userData.role)

    if (result.error) {
      return {
        success: false,
        message: result.error,
      }
    }

    if (!result.user) {
      return {
        success: false,
        message: "Errore durante la registrazione",
      }
    }

    return {
      success: true,
      message: "Registrazione completata con successo",
      user: result.user,
    }
  } catch (error) {
    console.error("Errore durante la registrazione:", error)
    return {
      success: false,
      message: "Si è verificato un errore durante la registrazione",
    }
  }
}

export async function signIn(credentials: {
  email: string
  password: string
}): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    const store = MockDataStore.getInstance()
    const result = store.signIn(credentials.email, credentials.password)

    if (result.error) {
      return {
        success: false,
        message: result.error,
      }
    }

    if (!result.user) {
      return {
        success: false,
        message: "Errore durante l'accesso",
      }
    }

    return {
      success: true,
      message: "Accesso effettuato con successo",
      user: result.user,
    }
  } catch (error) {
    console.error("Errore durante l'accesso:", error)
    return {
      success: false,
      message: "Si è verificato un errore durante l'accesso",
    }
  }
}

export async function signOut(): Promise<{ success: boolean; message: string }> {
  try {
    const store = MockDataStore.getInstance()
    store.signOut()

    return {
      success: true,
      message: "Logout effettuato con successo",
    }
  } catch (error) {
    console.error("Errore durante il logout:", error)
    return {
      success: false,
      message: "Si è verificato un errore durante il logout",
    }
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Mock password reset - just return success
    return {
      success: true,
      message: "Email di reset password inviata con successo (mock mode)",
    }
  } catch (error) {
    console.error("Errore durante il reset della password:", error)
    return {
      success: false,
      message: "Si è verificato un errore durante l'invio dell'email di reset",
    }
  }
}

export async function updatePassword(password: string): Promise<{ success: boolean; message: string }> {
  try {
    // Mock password update - just return success
    return {
      success: true,
      message: "Password aggiornata con successo (mock mode)",
    }
  } catch (error) {
    console.error("Errore durante l'aggiornamento della password:", error)
    return {
      success: false,
      message: "Si è verificato un errore durante l'aggiornamento della password",
    }
  }
}

export async function createStaffMember(staffData: {
  email: string
  name: string
  role: "admin" | "staff"
  barberId: string
}): Promise<{ success: boolean; message: string; staff?: StaffMember }> {
  const store = MockDataStore.getInstance()

  try {
    const result = store.signUp(staffData.email, "temp-password", staffData.name, staffData.role)

    if (result.error) {
      return {
        success: false,
        message: result.error,
      }
    }

    if (!result.user) {
      return {
        success: false,
        message: "Errore durante la creazione dell'utente",
      }
    }

    return {
      success: true,
      message: "Utente creato con successo (mock mode)",
      staff: {
        id: result.user.id,
        email: staffData.email,
        name: staffData.name,
        role: staffData.role,
        barberId: staffData.barberId,
      },
    }
  } catch (error) {
    console.error("Errore durante la creazione dell'utente:", error)
    return {
      success: false,
      message: "Si è verificato un errore durante la creazione dell'utente",
    }
  }
}

export async function deleteStaffMember(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const store = MockDataStore.getInstance()
    store.users.delete(id)
    return {
      success: true,
      message: "Utente eliminato con successo (mock mode)",
    }
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'utente:", error)
    return {
      success: false,
      message: "Si è verificato un errore durante l'eliminazione dell'utente",
    }
  }
}

export async function getStaffMembers(barberId: string): Promise<StaffMember[]> {
  try {
    const store = MockDataStore.getInstance()
    const users = Array.from(store.users.values())
    return users
      .filter((u) => u.barberId === barberId && (u.role === "admin" || u.role === "staff"))
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role as "admin" | "staff",
        barberId: u.barberId!,
      }))
  } catch (error) {
    console.error("Errore durante il recupero degli utenti:", error)
    return []
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const store = MockDataStore.getInstance()
    return store.getCurrentUser()
  } catch (error) {
    console.error("Errore durante il recupero dell'utente corrente:", error)
    return null
  }
}

export async function associateClientWithBarber(
  clientId: string,
  barberId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const store = MockDataStore.getInstance()
    const user = store.getUserById(clientId)
    if (user && user.role === "client") {
      user.barberId = barberId
      store.users.set(clientId, user)
    }
    return {
      success: true,
      message: "Associazione completata con successo",
    }
  } catch (error) {
    console.error("Errore durante l'associazione cliente-barbiere:", error)
    return {
      success: false,
      message: "Si è verificato un errore durante l'associazione",
    }
  }
}

