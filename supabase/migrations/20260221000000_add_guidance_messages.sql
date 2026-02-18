-- Guidance sent by staff to patients (next step, message, notification methods)
create table if not exists public.guidance_messages (
  id uuid primary key default gen_random_uuid(),
  ticket text not null,
  destination text,
  message text,
  vibration boolean default true,
  voice boolean default false,
  display_board boolean default true,
  sent_at timestamptz not null default now(),
  sent_by text,
  created_at timestamptz default now()
);

create index if not exists idx_guidance_messages_ticket on public.guidance_messages (ticket);
create index if not exists idx_guidance_messages_sent_at on public.guidance_messages (sent_at desc);

alter table public.guidance_messages enable row level security;
drop policy if exists "Allow all for guidance_messages" on public.guidance_messages;
create policy "Allow all for guidance_messages" on public.guidance_messages for all using (true) with check (true);
