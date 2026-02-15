-- Link staff to Supabase Auth and support role-based access.
-- Run after 20260212000000_initial_schema.sql.

-- Optional: link admin_users to auth.users (same user can be looked up by email)
alter table public.admin_users
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists idx_admin_users_auth_user_id on public.admin_users (auth_user_id) where auth_user_id is not null;

comment on column public.admin_users.auth_user_id is 'Links to Supabase Auth user; role is also resolved by matching email.';

-- For RLS: allow authenticated users to read their own role (by email from auth.jwt())
-- Uncomment and adjust when using RLS with anon key:
/*
create or replace function public.get_my_staff_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.admin_users
  where email = (auth.jwt() ->> 'email')
  and status = 'active'
  limit 1;
$$;
*/
