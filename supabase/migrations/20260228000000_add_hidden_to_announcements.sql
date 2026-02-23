-- Add hidden column to announcements table
alter table public.announcements
add column if not exists hidden boolean default false;

comment on column public.announcements.hidden is 'Whether this announcement is hidden from the landing page.';
