'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '../../lib/supabase/client';

const DESKTOP_BREAKPOINT = 1024;

function isSafeRedirect(path: string | null): path is string {
  if (!path || typeof path !== 'string') return false;
  return path.startsWith('/') && !path.startsWith('//');
}

export default function PatientLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const safeRedirect = isSafeRedirect(redirectParam) ? redirectParam : null;
  const [activeTab, setActiveTab] = useState<'account'>('account');

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const lock = () => {
      if (mq.matches) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };
    lock();
    mq.addEventListener('change', lock);
    return () => {
      mq.removeEventListener('change', lock);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createSupabaseBrowser();

  const handleAccessDashboard = () => {
    router.push(safeRedirect ?? '/pages/patient-dashboard');
  };

  const handleAccountLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Authentication is not configured. Please contact support.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        setError(signInError.message || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      if (!data.session?.access_token) {
        setError('No session created. Please try again.');
        setLoading(false);
        return;
      }

      // Verify patient profile exists (or send to complete-profile if missing)
      const res = await fetch('/api/patient-users', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (res.status === 404) {
        // Account verified but no profile row (e.g. signed up with email confirmation). Complete profile.
        const completeUrl = safeRedirect
          ? `/pages/patient-complete-profile?redirect=${encodeURIComponent(safeRedirect)}`
          : '/pages/patient-complete-profile';
        router.push(completeUrl);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not load your profile. Please contact support.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const profileData = await res.json();
      // Cache profile for Navbar so it shows the logged-in user immediately after redirect
      try {
        sessionStorage.setItem('patient_profile_cache', JSON.stringify({
          id: profileData.id,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
        }));
        sessionStorage.setItem('user_type_cache', 'patient');
      } catch {
        // Ignore storage errors
      }

      // Success - redirect to intended page or dashboard
      router.push(safeRedirect ?? '/pages/patient-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const backgroundImageUrl = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1920&q=80';

  return (
    <>
      <div className="relative min-h-screen overflow-y-auto lg:h-screen lg:max-h-screen lg:overflow-hidden">
        {/* Fixed full-screen background so it stays steady and fills the viewport */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          aria-hidden
        />
        <div className="fixed inset-0 bg-slate-900/40" aria-hidden />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6">
          {/* Back to Home - stays top left */}
          <div className="pt-8">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Login card - entrance animation on page load */}
          <div className="flex flex-1 items-start justify-center pt-6 pb-10">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg animate-fade-in-up">
            {/* User Icon */}
            <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <svg 
                    className="w-8 h-8 text-gray-600" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                >
                    <path 
                    fillRule="evenodd" 
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
                    clipRule="evenodd" 
                    />
                </svg>
                </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center mb-1">Patient Login</h1>
            <p className="text-gray-600 text-center text-sm mb-4">
                Access your queue status and appointments
            </p>

            {/* Account login */}
            <div className="min-h-[200px] overflow-hidden">
            {activeTab === 'account' && (
                <form key="account" onSubmit={handleAccountLogin} className="space-y-6 animate-tab-in">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                        {error}
                    </div>
                )}
                <div>
                    <label 
                    htmlFor="email" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                    >
                    Email
                    </label>
                    <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div>

                <div>
                    <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                    >
                    Password
                    </label>
                    <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                <p className="text-center text-sm text-gray-500 mt-4">
                    Don&apos;t have an account?{' '}
                    <Link href="/pages/patient-signup" className="text-blue-600 hover:underline">
                        Sign up
                    </Link>
                </p>
                </form>
            )}
            </div>
            </div>
        </div>
        </div>
      </div>
    </>
  );
}
