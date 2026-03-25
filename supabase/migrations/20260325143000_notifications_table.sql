-- Notifications table for clients and staff/admin.
-- Audience:
-- - 'user': recipient_user_id is required (client notification)
-- - 'barber_staff': barber_id is required, recipient_user_id is NULL (broadcast to admin/staff of the barber)

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid null,
  recipient_user_id uuid null,
  audience text not null check (audience in ('user', 'barber_staff')),
  type text not null,
  title text not null,
  body text null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_user_id_created_at_idx
  on public.notifications (recipient_user_id, created_at desc);

create index if not exists notifications_barber_id_created_at_idx
  on public.notifications (barber_id, created_at desc);

alter table public.notifications enable row level security;

-- Read: user can read their own notifications (audience=user).
create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (
  audience = 'user'
  and recipient_user_id = auth.uid()
);

-- Read: admin/staff can read barber staff notifications for their barber_id.
create policy "notifications_select_barber_staff"
on public.notifications
for select
to authenticated
using (
  audience = 'barber_staff'
  and barber_id is not null
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
      and p.barber_id = notifications.barber_id
  )
);

-- Insert: admin/staff can insert notifications for their barber_id (client or staff audience).
create policy "notifications_insert_admin_staff"
on public.notifications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
      and p.barber_id = notifications.barber_id
  )
);

-- Update read state: user can mark their own notifications as read.
create policy "notifications_update_read_own"
on public.notifications
for update
to authenticated
using (
  audience = 'user'
  and recipient_user_id = auth.uid()
)
with check (
  audience = 'user'
  and recipient_user_id = auth.uid()
);

-- Update read state: admin/staff can mark barber staff notifications as read (optional).
create policy "notifications_update_read_barber_staff"
on public.notifications
for update
to authenticated
using (
  audience = 'barber_staff'
  and barber_id is not null
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
      and p.barber_id = notifications.barber_id
  )
)
with check (
  audience = 'barber_staff'
  and barber_id is not null
);

