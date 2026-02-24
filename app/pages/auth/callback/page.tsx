'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '../../../lib/supabase/client';

/**
 * Handles redirect after user clicks the confirmation link in the signup email.
 * Supabase adds tokens to the URL hash; the client picks them up and we then
 * send the user to the dashboard or complete-profile.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'done'>('loading');

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    if (!supabase) {
      router.replace('/pages/patient-login');
      return;
    }

    let cancelled = false;

    (async () => {
      await new Promise((r) => setTimeout(r, 300));
      if (cancelled) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) {
        router.replace('/pages/patient-login');
        return;
      }
      const res = await fetch('/api/patient-users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (cancelled) return;
      if (res.status === 404) {
        router.replace('/pages/patient-complete-profile');
        return;
      }
      setStatus('done');
      router.replace('/pages/patient-dashboard');
    })();

    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#6C757D]">{status === 'loading' ? 'Signing you in…' : 'Redirecting…'}</p>
      </div>
    </div>
  );
}
