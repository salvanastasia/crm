import type { SupabaseClient } from "@supabase/supabase-js"
import { getDefaultBarberId } from "@/lib/salon-default"

/** Client-side: if role is client and no saloon yet, attach default business (single-salon). */
export async function linkClientToDefaultSalonIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  role: string,
  barberId: string | null | undefined,
): Promise<string | undefined> {
  if (role !== "client" || barberId) {
    return barberId || undefined
  }

  const defaultId = await getDefaultBarberId()
  if (!defaultId) return undefined

  const { error } = await supabase.from("profiles").update({ barber_id: defaultId }).eq("id", userId)

  if (error) {
    console.error("linkClientToDefaultSalonIfNeeded:", error)
    return undefined
  }

  return defaultId
}
