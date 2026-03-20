import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/** Server actions / Route Handlers: uses auth cookies (requires `@supabase/ssr` browser client for login). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          /* Server Component — ignore cookie writes */
        }
      },
    },
  })
}
