"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Barber } from "./types"

export async function getBarbers(): Promise<Barber[]> {
  const instant = await createSupabaseServerClient()
  if (!instant) return []

  try {
    const { data, error } = await instant.from("barbers").select("*")

    if (error) {
      console.error("Errore durante il recupero dei barbieri:", error)
      return []
    }

    return (data ?? []).map((barber) => ({
      id: barber.id,
      name: barber.name,
      email: barber.email,
      phone: barber.phone || undefined,
      address: barber.address || undefined,
      logoUrl: barber.logo_url || undefined,
      businessName: barber.business_name,
      ownerId: barber.owner_id,
    }))
  } catch (error) {
    console.error("Errore durante il recupero dei barbieri:", error)
    return []
  }
}

export async function getBarberById(id: string): Promise<Barber | null> {
  const instant = await createSupabaseServerClient()
  if (!instant) return null

  try {
    const { data, error } = await instant.from("barbers").select("*").eq("id", id).single()

    if (error || !data) {
      console.error("Errore durante il recupero del barbiere:", error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address || undefined,
      logoUrl: data.logo_url || undefined,
      businessName: data.business_name,
      ownerId: data.owner_id,
    }
  } catch (error) {
    console.error("Errore durante il recupero del barbiere:", error)
    return null
  }
}

export async function createBarber(barberData: {
  name: string
  email: string
  phone?: string
  address?: string
  logoUrl?: string
  businessName: string
  ownerId: string
}): Promise<Barber | null> {
  const instant = await createSupabaseServerClient()
  if (!instant) return null

  try {
    const { data, error } = await instant
      .from("barbers")
      .insert({
        name: barberData.name,
        email: barberData.email,
        phone: barberData.phone || null,
        address: barberData.address || null,
        logo_url: barberData.logoUrl || null,
        business_name: barberData.businessName,
        owner_id: barberData.ownerId,
      })
      .select()
      .single()

    if (error || !data) {
      console.error("Errore durante la creazione del barbiere:", error)
      return null
    }

    // Aggiorna il profilo dell'utente con il riferimento al barbiere
    const { error: profileError } = await instant
      .from("profiles")
      .update({ barber_id: data.id })
      .eq("id", barberData.ownerId)

    if (profileError) {
      console.error("Errore durante l'aggiornamento del profilo:", profileError)
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address || undefined,
      logoUrl: data.logo_url || undefined,
      businessName: data.business_name,
      ownerId: data.owner_id,
    }
  } catch (error) {
    console.error("Errore durante la creazione del barbiere:", error)
    return null
  }
}

export async function updateBarber(barberData: Barber): Promise<Barber | null> {
  const instant = await createSupabaseServerClient()
  if (!instant) return null

  try {
    const { data, error } = await instant
      .from("barbers")
      .update({
        name: barberData.name,
        email: barberData.email,
        phone: barberData.phone || null,
        address: barberData.address || null,
        logo_url: barberData.logoUrl || null,
        business_name: barberData.businessName,
      })
      .eq("id", barberData.id)
      .select()
      .single()

    if (error || !data) {
      console.error("Errore durante l'aggiornamento del barbiere:", error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address || undefined,
      logoUrl: data.logo_url || undefined,
      businessName: data.business_name,
      ownerId: data.owner_id,
    }
  } catch (error) {
    console.error("Errore durante l'aggiornamento del barbiere:", error)
    return null
  }
}

/**
 * Multi-shop: collega un cliente a un salone specifico (es. scelta da lista).
 * In modalità single-shop l’app usa `linkClientToDefaultSalonIfNeeded` + `getDefaultBarberId`.
 */
export async function associateClientWithBarber(
  clientId: string,
  barberId: string,
): Promise<{ success: boolean; message: string }> {
  const instant = await createSupabaseServerClient()
  if (!instant) return { success: false, message: "Database non configurato" }

  try {
    const { error } = await instant
      .from("profiles")
      .update({ barber_id: barberId })
      .eq("id", clientId)
      .eq("role", "client")

    if (error) {
      return {
        success: false,
        message: error.message,
      }
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

