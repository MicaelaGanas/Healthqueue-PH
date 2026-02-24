'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '../../lib/supabase/client';

const DESKTOP_BREAKPOINT = 1024;

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

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
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createSupabaseBrowser();
  const useAuth = Boolean(supabase);

  const handleSignInWithAuth = async () => {
    if (!supabase) return;
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setError(signInError.message || 'Sign in failed');
        setLoading(false);
        return;
      }
      const token = data.session?.access_token;
      if (!token) {
        setError('No session after sign in');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || (res.status === 403 ? 'No access; contact an administrator' : 'Could not load your role'));
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      const userRole = body.role;
      if (userRole === 'nurse') router.push('/pages/nurse-dashboard');
      else if (userRole === 'doctor') router.push('/pages/doctor-dashboard');
      else if (userRole === 'admin') router.push('/pages/admin-dashboard');
      else if (userRole === 'receptionist') router.push('/pages/nurse-dashboard');
      else if (userRole === 'laboratory') router.push('/pages/nurse-dashboard');
      else {
        setError('No dashboard assigned for your role');
        await supabase.auth.signOut();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
    setLoading(false);
  };

  const handleSignInDemo = () => {
    if (role === 'nurse') router.push('/pages/nurse-dashboard');
    else if (role === 'doctor') router.push('/pages/doctor-dashboard');
    else if (role === 'admin') router.push('/pages/admin-dashboard');
    else if (role === 'laboratory') router.push('/pages/nurse-dashboard');
    else if (role === 'receptionist') router.push('/pages/nurse-dashboard');
    else setError('Select a role');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useAuth) handleSignInWithAuth();
    else handleSignInDemo();
  };

  const backgroundImageUrl = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1920&q=80';

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
          <div className="pt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="flex flex-1 items-start justify-center pt-6 pb-10">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg animate-fade-in-up">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-1">Staff Login</h1>
              <p className="text-gray-600 text-center text-sm mb-6">
                {useAuth ? 'Sign in with your hospital email' : 'Demo mode: select a role (configure Supabase for real sign-in)'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {useAuth ? (
                  <>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@hospital.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">Role (demo)</label>
                      <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white appearance-none cursor-pointer"
                      >
                        <option value="">Select your Role</option>
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        <option value="admin">Administrator</option>
                        <option value="receptionist">Receptionist</option>
                      </select>
                    </div>
                  </>
                )}

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors mt-6"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500 mt-6">
                For authorized hospital personnel only. Contact IT support if you need access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
