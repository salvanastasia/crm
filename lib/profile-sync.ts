import type { SupabaseClient } from "@supabase/supabase-js"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { User } from "@/lib/types"
import { linkClientToDefaultSalonIfNeeded } from "@/lib/link-default-salon"

export type SyncProfileOptions = {
  /**
   * Usato solo alla creazione del profilo (es. OAuth senza user_metadata.role).
   * Valore salvato in sessionStorage prima del redirect OAuth, stesso origine.
   */
  pendingRole?: User["role"]
}

/**
 * Crea o aggiorna la riga profiles senza sovrascrivere il ruolo su utenti esistenti.
 */
export async function syncProfileFromAuthUser(
  supabase: SupabaseClient,
  sessionUser: SupabaseUser,
  opts?: SyncProfileOptions,
): Promise<User | null> {
  const fallbackName =
    (sessionUser.user_metadata?.name as string | undefined) ||
    (sessionUser.email ? sessionUser.email.split("@")[0] : "Utente")

  const metaRole = sessionUser.user_metadata?.role as string | undefined
  const roleFromMeta =
    metaRole && ["admin", "staff", "client"].includes(metaRole) ? (metaRole as User["role"]) : undefined

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sessionUser.id)
    .maybeSingle()

  if (selectError) {
    console.error("syncProfileFromAuthUser select:", selectError)
    return null
  }

  if (!existing) {
    const role = roleFromMeta ?? opts?.pendingRole ?? "client"
    const { error: insertError } = await supabase.from("profiles").insert({
      id: sessionUser.id,
      email: sessionUser.email ?? "",
      name: fallbackName,
      role,
    })
    if (insertError) {
      console.error("syncProfileFromAuthUser insert:", insertError)
      return null
    }
  } else {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email: sessionUser.email ?? existing.email,
        name: fallbackName,
      })
      .eq("id", sessionUser.id)
    if (updateError) {
      console.error("syncProfileFromAuthUser update:", updateError)
      return null
    }
  }

  const { data: profileData, error: finalError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sessionUser.id)
    .single()

  if (finalError || !profileData) return null

  let barberId: string | undefined = profileData.barber_id || undefined
  const role = profileData.role as User["role"]

  if (role === "client") {
    const linked = await linkClientToDefaultSalonIfNeeded(supabase, sessionUser.id, role, barberId)
    if (linked) barberId = linked
  }

  return {
    id: profileData.id,
    email: profileData.email,
    name: profileData.name,
    role,
    phone: profileData.phone || undefined,
    barberId,
  }
}
