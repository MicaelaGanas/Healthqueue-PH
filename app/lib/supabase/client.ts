"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client for client components. Use for optional realtime subscriptions.
 * For most data, the app uses API routes that call the server Supabase client.
 */
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}
