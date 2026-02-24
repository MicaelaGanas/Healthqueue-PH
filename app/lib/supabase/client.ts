"use client";

import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";

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

function isInvalidRefreshTokenError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  const name = e && typeof e === "object" && "name" in e ? (e as { name: string }).name : "";
  return (
    name === "AuthApiError" ||
    /refresh token not found|invalid refresh token/i.test(msg)
  );
}

/**
 * Get current session. If the refresh token is invalid (e.g. revoked or expired on server),
 * signs out to clear the bad session and returns null so the app can redirect to login.
 * Use this instead of supabase.auth.getSession() in guards and nav to avoid AuthApiError in console.
 */
export async function getSessionOrSignOut(
  supabase: SupabaseClient | null
): Promise<{ session: Session | null }> {
  if (!supabase) return { session: null };
  try {
    const { data } = await supabase.auth.getSession();
    return { session: data.session };
  } catch (e) {
    if (isInvalidRefreshTokenError(e)) {
      await supabase.auth.signOut({ scope: "local" });
      return { session: null };
    }
    throw e;
  }
}
