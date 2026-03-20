# Admin data layer & API audit

## What changed

- **CRM data** (servizi, staff/risorse, clienti, appuntamenti, brand, orari, notifiche) is no longer backed by the in-memory `MockDataStore` in `lib/actions.ts`. It now uses **PostgreSQL via Supabase**, with **server actions** executing as the logged-in user (session in **cookies** via `@supabase/ssr` + browser client).
- **`lib/barber.ts`** uses the same server client instead of the mock.
- **New table `clients`**: run `supabase/migrations/20250320120000_add_clients_table.sql` in the Supabase SQL editor (or CLI) so CRM anagrafica clienti and walk-in booking work.
- Removed duplicate **`lib/supabase/database.types`** (extensionless file) so the schema in **`database.types.ts`** is the single source of truth for typings/documentation.

## “API” check for admin features

Admin mutations are **not** exposed as REST routes; they live as **Next.js server actions** in `lib/actions.ts` (and `lib/barber.ts`).

To audit connectivity and RLS in one shot:

```http
GET /api/admin/feature-check
```

Call while **logged in as admin or staff** in the **same browser** (session cookies). The JSON lists:

- All existing **`app/api/*`** HTTP routes and their purpose.
- The **server action areas** and target tables.
- **`tableChecks`**: a `select ... limit 1` per salon-scoped table (when `profiles.barber_id` is set).

If `tableChecks.clients` fails with “relation does not exist”, apply the migration above.

## RLS

Policies must allow the logged-in salon user to read/write rows where `barber_id` matches their `profiles.barber_id`. See `supabase-policies.sql` for the intended model.
