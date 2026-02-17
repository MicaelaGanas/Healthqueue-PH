"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

/**
 * Browser Supabase client for client components. Use for optional realtime subscriptions.
 * For most data, the app uses API routes that call the server Supabase client.
 * Uses singleton pattern to avoid recreating the client on every call.
 */
export function createSupabaseBrowser() {
  if (supabaseClient) {
    return supabaseClient;
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anonKey) return null;
  
  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}
