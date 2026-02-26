"use client";

import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

type SessionResponse = {
  data: { session: Session | null };
  error: null;
};

function createNullSessionResponse(): SessionResponse {
  return {
    data: { session: null },
    error: null,
  };
}

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
  hardenSupabaseAuth(supabaseClient);
  return supabaseClient;
}

function isInvalidRefreshTokenError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  const name = e && typeof e === "object" && "name" in e ? (e as { name: string }).name : "";
  const code = e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "";
  return (
    (name === "AuthApiError" && /refresh token|token/i.test(msg)) ||
    /refresh_token_not_found|invalid_refresh_token/i.test(code) ||
    /refresh token not found|invalid refresh token/i.test(msg)
  );
}

function hardenSupabaseAuth(client: SupabaseClient): void {
  const originalGetSession = client.auth.getSession.bind(client.auth);

  client.auth.getSession = async () => {
    try {
      return await originalGetSession();
    } catch (e) {
      if (!isInvalidRefreshTokenError(e)) {
        throw e;
      }

      try {
        await client.auth.signOut({ scope: "local" });
      } catch {
        // Ignore: we still return a null session to callers.
      }

      return createNullSessionResponse();
    }
  };
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
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Ignore local sign-out failures for invalid refresh token cleanup.
      }
      return { session: null };
    }
    throw e;
  }
}
