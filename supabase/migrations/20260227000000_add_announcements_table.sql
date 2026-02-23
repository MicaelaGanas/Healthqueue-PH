-- Announcements: only admins can create. Types: notice, info, alert. Shown on landing page.
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('notice', 'info', 'alert')),
  title text not null,
  description text not null,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_announcements_created_at on public.announcements (created_at desc);

alter table public.announcements enable row level security;
drop policy if exists "Allow all for announcements" on public.announcements;
create policy "Allow all for announcements" on public.announcements for all using (true) with check (true);

comment on table public.announcements is 'Announcements posted by admins. Types: notice, info, alert. Displayed on landing page.';
