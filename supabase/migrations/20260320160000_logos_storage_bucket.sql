-- Storage bucket for CRM/booking logo images.
-- Rationale:
-- - Persist `business_settings.logo_url` as a stable Storage public URL (not a `blob:` URL).
-- - Allow shop admins/staff to upload logos under `${barber_id}/...`.

-- 1) Create (or update) the bucket.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id)
do update
set public = excluded.public;

-- 2) Enable RLS for objects.
alter table storage.objects enable row level security;

-- 3) Public reads (bucket is public, but keep an explicit policy for safety).
drop policy if exists "logos_public_select" on storage.objects;
create policy "logos_public_select"
on storage.objects
for select
using (bucket_id = 'logos');

-- Helper condition: the object name must start with the authenticated user's `barber_id`.
-- Expected object path format: `${barber_id}/logo.<ext>`

drop policy if exists "logos_authenticated_insert" on storage.objects;
create policy "logos_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'logos'
  and split_part(name, '/', 1)::uuid = (
    select p.barber_id
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
      and p.barber_id is not null
    limit 1
  )
);

drop policy if exists "logos_authenticated_update" on storage.objects;
create policy "logos_authenticated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'logos'
  and split_part(name, '/', 1)::uuid = (
    select p.barber_id
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
      and p.barber_id is not null
    limit 1
  )
)
with check (
  bucket_id = 'logos'
  and split_part(name, '/', 1)::uuid = (
    select p.barber_id
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
      and p.barber_id is not null
    limit 1
  )
);

drop policy if exists "logos_authenticated_delete" on storage.objects;
create policy "logos_authenticated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'logos'
  and split_part(name, '/', 1)::uuid = (
    select p.barber_id
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
      and p.barber_id is not null
    limit 1
  )
);

