-- Run this in Supabase Dashboard → SQL Editor to fix "column does not exist" errors
-- Adds avatar_url to patient_users, staff_users, and admin_users

alter table public.patient_users
  add column if not exists avatar_url text;

alter table public.staff_users
  add column if not exists avatar_url text;

alter table public.admin_users
  add column if not exists avatar_url text;
