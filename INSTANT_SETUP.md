# InstantDB setup

1. Copy `.env.example` to `.env.local`.
2. Fill the values from your Instant dashboard:
   - `NEXT_PUBLIC_INSTANT_APP_ID`
   - `INSTANT_APP_ADMIN_TOKEN`
3. Run `npm run dev`.

## Where Instant is configured

- Client database: `lib/instant/db.ts`
- Server/admin database: `lib/instant/admin.ts`
- Compatibility wrappers used by the current app:
  - `lib/instant/client.ts`
  - `lib/instant/server.ts`
  - `lib/instant/service.ts`
