-- Pending walk-ins: patients registered at the desk but not yet added to the queue.
-- Persists across refresh; not limited to one day — rows stay until added to queue or cancelled.
-- created_at = real timestamp for filtering/sorting by date; registered_at = display label.
create table if not exists public.pending_walk_ins (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  age text not null,
  sex text not null,
  phone text default '',
  email text default '',
  booking_reference text default '',
  symptoms jsonb default '[]'::jsonb,
  other_symptoms text default '',
  registered_at text not null,
  created_at timestamptz default now()
);

alter table public.pending_walk_ins enable row level security;
drop policy if exists "Allow all for pending_walk_ins" on public.pending_walk_ins;
create policy "Allow all for pending_walk_ins" on public.pending_walk_ins for all using (true) with check (true);
