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
  const isProbablyRlsOrPermissionError = (err: unknown) => {
    const msg = String((err as any)?.message ?? "")
    return (
      msg.includes("row-level security") ||
      msg.includes("violates row-level security") ||
      msg.toLowerCase().includes("permission") ||
      msg.toLowerCase().includes("rls")
    )
  }

  const fallbackName =
    (sessionUser.user_metadata?.name as string | undefined) ||
    (sessionUser.email ? sessionUser.email.split("@")[0] : "Utente")

  const metaRole = sessionUser.user_metadata?.role as string | undefined
  const roleFromMeta =
    metaRole && ["admin", "staff", "client"].includes(metaRole) ? (metaRole as User["role"]) : undefined

  const selectProfile = async () => {
    return supabase
      .from("profiles")
      .select("*")
      .eq("id", sessionUser.id)
      .maybeSingle()
  }

  const first = await selectProfile()
  let existing = first.data
  let selectError = first.error

  if (selectError) {
    console.error("syncProfileFromAuthUser select:", selectError)

    // Some role/migration mismatches can leave the app unable to read its own profile.
    // Attempt a one-time policy repair and retry the select.
    if (isProbablyRlsOrPermissionError(selectError)) {
      try {
        await fetch("/api/fix-profiles-policy", { method: "POST" })
        const retry = await selectProfile()
        existing = retry.data
        selectError = retry.error
      } catch {
        // ignore - we'll fall through to return null
      }
    }
  }

  if (selectError) return null

  if (!existing) {
    const role = roleFromMeta ?? opts?.pendingRole ?? "client"
    const { error: insertError } = await supabase.from("profiles").insert({
      id: sessionUser.id,
      email: sessionUser.email ?? "",
      name: fallbackName,
      role,
      phone: (sessionUser.user_metadata?.phone as string | undefined) ?? null,
    })
    if (insertError) {
      console.error("syncProfileFromAuthUser insert:", insertError)
      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-auth-callback',hypothesisId:'M',location:'lib/profile-sync.ts:syncProfileFromAuthUser',message:'syncProfileFromAuthUser:insert:error',data:{errorMessage:insertError?.message??null},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      return null
    }
  } else {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email: sessionUser.email ?? existing.email,
        name: fallbackName,
        phone: (sessionUser.user_metadata?.phone as string | undefined) ?? existing.phone ?? null,
      })
      .eq("id", sessionUser.id)
    if (updateError) {
      console.error("syncProfileFromAuthUser update:", updateError)
      // #region agent log
      fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-auth-callback',hypothesisId:'M',location:'lib/profile-sync.ts:syncProfileFromAuthUser',message:'syncProfileFromAuthUser:update:error',data:{errorMessage:updateError?.message??null},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      return null
    }
  }

  const { data: profileData, error: finalError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sessionUser.id)
    .single()

  if (finalError || !profileData) {
    console.error("syncProfileFromAuthUser final select:", finalError)
    // #region agent log
    fetch('http://127.0.0.1:7468/ingest/1d7adf57-dba0-41ca-81ee-3c4bffb08dde',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd094c'},body:JSON.stringify({sessionId:'dd094c',runId:'post-fix-auth-callback',hypothesisId:'M',location:'lib/profile-sync.ts:syncProfileFromAuthUser',message:'syncProfileFromAuthUser:final:select:error',data:{errorMessage:finalError?.message??null},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    return null
  }

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
    avatarUrl: (sessionUser.user_metadata?.avatar_url as string | undefined) ?? undefined,
    role,
    phone: profileData.phone || undefined,
    barberId,
  }
}
