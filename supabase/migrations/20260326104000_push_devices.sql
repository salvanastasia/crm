create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  barber_id uuid null,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_devices_user_id_idx on public.push_devices(user_id);
create index if not exists push_devices_barber_id_idx on public.push_devices(barber_id);
create index if not exists push_devices_is_active_idx on public.push_devices(is_active);

create or replace function public.set_push_devices_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_push_devices_updated_at on public.push_devices;
create trigger trg_push_devices_updated_at
before update on public.push_devices
for each row
execute function public.set_push_devices_updated_at();

alter table public.push_devices enable row level security;

drop policy if exists "push_devices_select_own" on public.push_devices;
create policy "push_devices_select_own"
on public.push_devices
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "push_devices_insert_own" on public.push_devices;
create policy "push_devices_insert_own"
on public.push_devices
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "push_devices_update_own" on public.push_devices;
create policy "push_devices_update_own"
on public.push_devices
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

