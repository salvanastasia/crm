import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

/** Documented HTTP endpoints under `app/api` (not all are admin-specific). */
const HTTP_API_ROUTES = [
  { path: "/api/admin/feature-check", methods: ["GET"], purpose: "This report + DB probe for logged-in salon user" },
  { path: "/api/check-database", methods: ["GET"], purpose: "Health: profiles + business_settings (service client)" },
  { path: "/api/create-profile", methods: ["POST"], purpose: "Bootstrap profile (dev)" },
  { path: "/api/create-test-user", methods: ["GET"], purpose: "Create test auth users (dev)" },
  { path: "/api/fix-profiles-policy", methods: ["POST"], purpose: "RLS helper" },
  { path: "/api/fix-recursive-policy", methods: ["POST"], purpose: "RLS helper" },
  { path: "/api/get-profile", methods: ["GET"], purpose: "Read profile" },
  { path: "/api/get-profile-direct", methods: ["GET"], purpose: "Read profile (direct)" },
] as const

/** Admin CRM mutations go through Next.js server actions in `lib/actions.ts` (not REST). */
const SERVER_ACTION_AREAS = [
  "getServices / addService / updateService / deleteService → table `services`",
  "getResources / addResource / updateResource / deleteResource → `resources`, `resource_services`",
  "getClients / addClient / updateClient / deleteClient → `clients`",
  "getAppointments / getClientAppointments / bookAppointment → `appointments`, `clients`",
  "getBrandSettings / updateBrandSettings → `business_settings`",
  "getBusinessHours / updateBusinessHours → `business_hours`",
  "getNotificationSettings / updateNotificationSettings → `notification_settings`",
  "getBarbers / getBarberById / createBarber / updateBarber / associateClientWithBarber → `lib/barber.ts` (`barbers`, `profiles`)",
]

export async function GET() {
  const supabase = await createSupabaseServerClient()

  if (!supabase || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({
      ok: false,
      error: "Supabase server client unavailable (env NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)",
      httpApiRoutes: HTTP_API_ROUTES,
      serverActions: SERVER_ACTION_AREAS,
    })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: { barber_id: string | null; role: string | null } | null = null
  if (user) {
    const { data } = await supabase.from("profiles").select("barber_id, role").eq("id", user.id).maybeSingle()
    profile = data
  }

  const barberId = profile?.barber_id ?? null
  const isAdminOrStaff = profile?.role === "admin" || profile?.role === "staff"

  const tableChecks: Record<string, { ok: boolean; message?: string }> = {}

  if (user && barberId && isAdminOrStaff) {
    const scoped = ["services", "clients", "resources", "appointments", "business_settings", "business_hours", "notification_settings"] as const
    for (const table of scoped) {
      const { error } = await supabase.from(table).select("id").eq("barber_id", barberId).limit(1)
      tableChecks[table] = error ? { ok: false, message: error.message } : { ok: true }
    }
    const { error: rsErr } = await supabase.from("resource_services").select("resource_id").limit(1)
    tableChecks.resource_services = rsErr ? { ok: false, message: rsErr.message } : { ok: true }
  } else {
    tableChecks._note = {
      ok: true,
      message:
        user && !barberId
          ? "Profilo senza barber_id: esegui onboarding o collega il salone prima di testare le tabelle."
          : !user
            ? "Nessuna sessione: accedi come admin/staff con cookie (stesso browser dopo login) per probe RLS sulle tabelle."
            : "Ruolo non admin/staff: probe tabelle saltato.",
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    auth: {
      userId: user?.id ?? null,
      email: user?.email ?? null,
      profileRole: profile?.role ?? null,
      barberId,
    },
    httpApiRoutes: HTTP_API_ROUTES,
    serverActions: SERVER_ACTION_AREAS,
    tableChecks,
    clientsTableMigration: "Run supabase/migrations/20250320120000_add_clients_table.sql if `clients` is missing.",
  })
}
