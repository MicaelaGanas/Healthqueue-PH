-- Staff activity log: record of actions by staff (confirm booking, add walk-in, cancel, etc.) for admin overview.
create table if not exists public.staff_activity_log (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.admin_users(id) on delete set null,
  staff_name text not null,
  staff_email text not null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_staff_activity_log_created_at on public.staff_activity_log (created_at desc);

alter table public.staff_activity_log enable row level security;
drop policy if exists "Allow all for staff_activity_log" on public.staff_activity_log;
create policy "Allow all for staff_activity_log" on public.staff_activity_log for all using (true) with check (true);
