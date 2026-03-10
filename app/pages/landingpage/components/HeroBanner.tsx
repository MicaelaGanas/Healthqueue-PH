"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80";

function CommunityIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Friendly community healthcare illustration"
    >
      <defs>
        <linearGradient id="hqWarmBg" x1="64" y1="28" x2="452" y2="392" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E3F2FF" />
          <stop offset="0.55" stopColor="#F4F9FF" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
        <linearGradient id="hqWarmAccent" x1="90" y1="90" x2="470" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="#007bff" />
          <stop offset="0.55" stopColor="#4ea5ff" />
          <stop offset="1" stopColor="#b3d9ff" />
        </linearGradient>
        <filter id="hqSoftShadow" x="0" y="0" width="520" height="420" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#0F172A" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Soft background blob */}
      <path
        d="M83 190c22-93 133-164 238-144 105 20 169 122 146 216-24 94-126 130-226 125-100-6-179-104-158-197Z"
        fill="url(#hqWarmBg)"
        opacity="0.95"
      />

      {/* Card */}
      <g filter="url(#hqSoftShadow)">
        <rect x="138" y="128" width="276" height="200" rx="22" fill="white" />
        <rect x="138" y="128" width="276" height="200" rx="22" fill="url(#hqWarmAccent)" opacity="0.12" />
        <rect x="162" y="152" width="168" height="14" rx="7" fill="#0F172A" opacity="0.12" />
        <rect x="162" y="176" width="220" height="12" rx="6" fill="#0F172A" opacity="0.10" />
        <rect x="162" y="198" width="192" height="12" rx="6" fill="#0F172A" opacity="0.08" />
        <rect x="162" y="238" width="112" height="34" rx="12" fill="#007bff" opacity="0.12" />
        <path
          d="M215 248h11v-7h9v7h11v9h-11v7h-9v-7h-11v-9Z"
          fill="#007bff"
          opacity="0.75"
        />
        <rect x="284" y="238" width="112" height="34" rx="12" fill="#dae9ff" opacity="0.7" />
        <rect x="300" y="251" width="78" height="10" rx="5" fill="#007bff" opacity="0.6" />
      </g>

      {/* People (simple friendly shapes) */}
      <circle cx="124" cy="290" r="30" fill="#ddecff" />
      <rect x="88" y="318" width="86" height="56" rx="28" fill="#b3d4ff" opacity="0.95" />
      <circle cx="432" cy="286" r="28" fill="#ddecff" />
      <rect x="396" y="312" width="78" height="58" rx="29" fill="#82b9ff" opacity="0.95" />

      {/* Heart */}
      <path
        d="M260 92c18-18 46-8 51 14 6 26-20 44-51 66-31-22-57-40-51-66 5-22 33-32 51-14Z"
        fill="#007bff"
        opacity="0.4"
      />
    </svg>
  );
}

export function HeroBanner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      className="relative min-h-[380px] overflow-hidden bg-[#f5f8ff] sm:min-h-[460px]"
      aria-label="Hero"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 ease-out"
        style={{
          backgroundImage: `url(${HERO_IMAGE_URL})`,
          transform: mounted ? "scale(1)" : "scale(1.05)",
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#e7f0ff]/90 via-[#f5f8ff]/96 to-[#ffffff]"
        aria-hidden
      />
      <div
        className="absolute -bottom-28 left-1/2 h-72 w-[58rem] -translate-x-1/2 rounded-[999px] bg-[#007bff]/18 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -top-32 left-1/4 h-64 w-64 rounded-full bg-[#60a5ff]/18 blur-3xl"
        aria-hidden
      />
      <div
        className={`relative mx-auto flex min-h-[360px] max-w-7xl items-center px-4 py-14 sm:min-h-[420px] sm:px-6 ${
          mounted ? "animate-fade-in-up" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="w-full">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="mx-auto max-w-3xl text-center sm:text-left lg:mx-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#007bff]/10 bg-white/80 px-3 py-1 text-xs font-semibold text-[#1e293b] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                A kinder way to queue at the clinic
              </span>

              <h1
                className="mt-5 text-3xl font-bold tracking-tight text-[#0056b3] sm:text-4xl md:text-5xl"
                style={{ fontFamily: "var(--font-rosario), sans-serif" }}
              >
                HealthQueue PH
              </h1>

              <p className="mt-3 text-base font-medium text-[#003566] sm:text-lg">
                Check wait times, track your queue, and book appointments—so your visit feels calm, organized, and on time.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl border border-[#cbd5f5] bg-white/70 p-4 backdrop-blur sm:max-w-xl">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-semibold text-[#0f172a]">Live status</p>
                  <p className="mt-0.5 text-xs text-[#64748b]">Real-time queue visibility</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-semibold text-[#0f172a]">Faster booking</p>
                  <p className="mt-0.5 text-xs text-[#64748b]">Schedule in minutes</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-semibold text-[#0f172a]">Clear directions</p>
                  <p className="mt-0.5 text-xs text-[#64748b]">Find departments quickly</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex justify-center">
              <CommunityIllustration className="w-full max-w-[520px] animate-float-soft" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
