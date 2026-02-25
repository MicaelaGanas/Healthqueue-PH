'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '../../lib/supabase/client';

const OTP_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;

const PASSWORD_RULES = [
  { id: 'length', label: `At least ${MIN_PASSWORD_LENGTH} characters`, test: (p: string) => p.length >= MIN_PASSWORD_LENGTH },
  { id: 'lower', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'upper', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
  { id: 'special', label: 'One special character (!@#$%^&* etc.)', test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
] as const;

function getPasswordRequirements(password: string) {
  return PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }));
}

function getPasswordStrength(password: string): 'weak' | 'fair' | 'strong' | 'none' {
  if (!password.length) return 'none';
  const met = getPasswordRequirements(password).filter((r) => r.met).length;
  if (met < 3) return 'weak';
  if (met < 5) return 'fair';
  return 'strong';
}

export default function PatientSignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    number: '',
    address: '',
  });

  const supabase = createSupabaseBrowser();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = d;
      });
      setOtp(next);
      const nextFocus = Math.min(index + digits.length, OTP_LENGTH - 1);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');
    if (digit && index < OTP_LENGTH - 1) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const passwordsMismatch = form.password.length > 0 && form.confirm_password.length > 0 && form.password !== form.confirm_password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Sign up is not configured. Please set up Supabase.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Unable to sign up. Passwords do not match.');
      return;
    }
    const requirements = getPasswordRequirements(form.password);
    const allMet = requirements.every((r) => r.met);
    if (!allMet) {
      const missing = requirements.filter((r) => !r.met).map((r) => r.label);
      setError(`Please create a stronger password. Missing: ${missing.join('; ')}.`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/pages/auth/callback` : undefined },
      });
      if (signUpError) {
        const msg = signUpError.message ?? '';
        const isEmailRateLimit = /email.*rate limit|rate limit.*email/i.test(msg);
        const isConfirmEmailError = /error sending confirmation email/i.test(msg);
        setError(
          isEmailRateLimit
            ? 'Too many sign-up attempts. Please try again in an hour, or contact support if you need access sooner.'
            : isConfirmEmailError
              ? 'We couldn\'t send the confirmation email. If you\'re testing with Resend sandbox, use the same email you used to sign up for Resend. Otherwise check Supabase → Authentication → SMTP (username must be "resend", password = API key). See docs/EMAIL_SMTP_SETUP.md.'
              : msg || 'Sign up failed'
        );
        setLoading(false);
        return;
      }
      setStep('otp');
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('').trim();
    if (code.length !== OTP_LENGTH) {
      setError(`Please enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }
    if (!supabase) return;
    setError('');
    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: form.email.trim(),
        token: code,
        type: 'signup',
      });
      if (verifyError) {
        setError(verifyError.message || 'Invalid or expired code. Try again or use the link in your email.');
        setLoading(false);
        return;
      }
      const token = data.session?.access_token;
      if (!token) {
        setError('Verification succeeded. Please log in.');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/patient-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      if (!res.ok && res.status !== 409) {
        setError(body.error || 'Failed to save profile');
        setLoading(false);
        return;
      }
      router.push('/pages/patient-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setLoading(false);
  };

  const backgroundImageUrl = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1920&q=80';

  return (
    <>
      <div className="relative min-h-screen">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          aria-hidden
        />
        <div className="fixed inset-0 bg-slate-900/40" aria-hidden />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6">
          <div className="pt-8">
            <Link
              href="/pages/patient-login"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Patient Login</span>
            </Link>
          </div>

          <div className="flex flex-1 items-start justify-center pt-6 pb-10">
            <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-lg animate-fade-in-up">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-2">
                {step === 'form' ? 'Patient Sign Up' : 'Verify your email'}
              </h1>
              <p className="text-gray-600 text-center mb-6">
                {step === 'form'
                  ? 'Create an account to access your queue status and appointments'
                  : `We sent a 6-digit code to ${form.email}. Enter it below.`}
              </p>

              {step === 'otp' ? (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpInputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        aria-label={`Digit ${i + 1}`}
                      />
                    ))}
                  </div>
                  {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors mt-2"
                  >
                    {loading ? 'Verifying…' : 'Verify and continue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setError(''); }}
                    className="w-full text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Back to form
                  </button>
                </form>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                      First name
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="Juan"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Last name
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="Dela Cruz"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    minLength={MIN_PASSWORD_LENGTH}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                    aria-describedby="password-requirements"
                  />
                  <div id="password-requirements" className="mt-2 space-y-1.5" aria-live="polite">
                    {form.password.length > 0 && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600">Strength:</span>
                          <span
                            className={`text-xs font-medium ${
                              getPasswordStrength(form.password) === 'strong'
                                ? 'text-green-600'
                                : getPasswordStrength(form.password) === 'fair'
                                  ? 'text-amber-600'
                                  : getPasswordStrength(form.password) === 'weak'
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                            }`}
                          >
                            {getPasswordStrength(form.password) === 'none'
                              ? ''
                              : getPasswordStrength(form.password).charAt(0).toUpperCase() +
                                getPasswordStrength(form.password).slice(1)}
                          </span>
                          {getPasswordStrength(form.password) !== 'none' && (
                            <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden max-w-[80px]">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  getPasswordStrength(form.password) === 'strong'
                                    ? 'w-full bg-green-500'
                                    : getPasswordStrength(form.password) === 'fair'
                                      ? 'w-2/3 bg-amber-500'
                                      : 'w-1/3 bg-red-500'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          {getPasswordRequirements(form.password).map(({ id, label, met }) => (
                            <li key={id} className="flex items-center gap-2">
                              {met ? (
                                <span className="text-green-600" aria-hidden>✓</span>
                              ) : (
                                <span className="text-gray-400" aria-hidden>○</span>
                              )}
                              <span className={met ? 'text-green-700' : 'text-gray-500'}>{label}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    minLength={MIN_PASSWORD_LENGTH}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                  {passwordsMismatch && <p className="text-sm text-red-600 mt-1 p-2 rounded">Passwords do not match</p>}
                </div>

                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    id="number"
                    name="number"
                    value={form.number}
                    onChange={handleChange}
                    placeholder="+63 912 345 6789"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street, Barangay, City, Province"
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors mt-2"
                >
                  {loading ? 'Sending code…' : 'Sign Up'}
                </button>
              </form>
              )}

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <Link href="/pages/patient-login" className="text-blue-600 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
