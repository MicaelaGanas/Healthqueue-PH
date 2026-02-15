import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Server-side Supabase client. Use in API routes and Server Components.
 * Prefer SUPABASE_SERVICE_ROLE_KEY for API routes (bypasses RLS); use anon key for RLS.
 * Throws if env is missing (use getSupabaseServer() for a safe version that returns null).
 */
export function createSupabaseServer(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key. Check .env.");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

/** Returns Supabase client or null when not configured (e.g. for graceful fallback in API routes). */
export function getSupabaseServer(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey);
}
