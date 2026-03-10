'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '../../lib/supabase/client';

function isSafeRedirect(path: string | null): path is string {
  if (!path || typeof path !== 'string') return false;
  return path.startsWith('/') && !path.startsWith('//');
}

export default function PatientCompleteProfilePage() {
  return (
    <Suspense
      fallback={(
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
          <div className="w-10 h-10 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    >
      <PatientCompleteProfileContent />
    </Suspense>
  );
}

function PatientCompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const safeRedirect = isSafeRedirect(redirectParam) ? redirectParam : null;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    number: '',
    address: '',
  });

  const supabase = createSupabaseBrowser();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) {
        router.replace('/pages/patient-login');
        return;
      }
      setLoading(false);
    });
  }, [supabase, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace('/pages/patient-login');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/patient-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          number: form.number.trim(),
          address: form.address.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Failed to save profile');
        setSubmitting(false);
        return;
      }
      if (body?.id != null) {
        try {
          sessionStorage.setItem('patient_profile_cache', JSON.stringify({
            id: body.id,
            email: body.email ?? '',
            first_name: body.first_name ?? '',
            last_name: body.last_name ?? '',
          }));
          sessionStorage.setItem('user_type_cache', 'patient');
        } catch {
          // Ignore storage errors
        }
      }
      router.push(safeRedirect ?? '/pages/patient-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="w-10 h-10 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // New flow no longer uses this page for completing profiles.
  // If someone lands here (old bookmark, etc.), just send them to the dashboard.
  useEffect(() => {
    router.replace('/pages/patient-dashboard');
  }, [router]);

  return null;
}
