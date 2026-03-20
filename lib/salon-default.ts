"use server"

import { createClient } from "@supabase/supabase-js"

/**
 * Single-salon mode: optional explicit id, otherwise first barbers row (by created_at).
 * Multi-shop logic elsewhere can keep using associateClientWithBarber + pick a saloon.
 */
export async function getDefaultBarberId(): Promise<string | null> {
  const envId = process.env.NEXT_PUBLIC_DEFAULT_BARBER_ID?.trim()
  if (envId) return envId

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  const supabase = createClient(url, anonKey)
  const { data, error } = await supabase
    .from("barbers")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data?.id) return null
  return data.id as string
}
