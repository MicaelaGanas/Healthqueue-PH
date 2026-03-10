"use client";

import { Suspense } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type DisplayPayload = {
  updatedAt: string;
  date: string;
  department: string;
  waitingCount: number;
  doctorOnDuty: string | null;
  nowServing: { ticket: string; status: string } | null;
  nextUp: { ticket: string; status: string; estimatedWait: string } | null;
  upcoming: { ticket: string; status: string; estimatedWait: string }[];
};

function formatUpdateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
}

function formatVoiceTicket(ticket: string): string {
  return ticket.replace(/-/g, " ");
}

function getTodayLocalYmd(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pickPreferredVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const femaleHints = [
    "female",
    "zira",
    "samantha",
    "karen",
    "hazel",
    "aria",
    "jenny",
    "joanna",
    "serena",
    "michelle",
    "linda",
    "eva",
    "catherine",
    "anna",
  ];

  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const femaleEnglish = englishVoices.find((voice) => {
    const name = voice.name.toLowerCase();
    return femaleHints.some((hint) => name.includes(hint));
  });
  if (femaleEnglish) return femaleEnglish;

  if (englishVoices.length > 0) return englishVoices[0];
  return voices[0];
}

function QueueDisplayClient() {
  const params = useSearchParams();
  const department = (params.get("department") ?? "").trim();
  const autoFullscreen = params.get("fullscreen") === "1";
  const autoVoice = params.get("autovoice") !== "0";

  const [data, setData] = useState<DisplayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(autoVoice);
  const previousNowServingRef = useRef<string | null>(null);

  const fetchDisplay = useCallback(async () => {
    if (!department) {
      setError("Department is required.");
      setLoading(false);
      return;
    }
    try {
      if (!data) setLoading(true);
      setError(null);
      const date = getTodayLocalYmd();
      const res = await fetch(`/api/landing/department-display?department=${encodeURIComponent(department)}&date=${encodeURIComponent(date)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load queue display.");
      const body = (await res.json()) as DisplayPayload;
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue display.");
    } finally {
      setLoading(false);
    }
  }, [department, data]);

  useEffect(() => {
    fetchDisplay();
  }, [fetchDisplay]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchDisplay();
    }, 6000);
    return () => clearInterval(id);
  }, [fetchDisplay]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen errors for unsupported browsers/devices.
    }
  }, []);

  useEffect(() => {
    if (!autoFullscreen) return;
    if (document.fullscreenElement) return;
    const id = window.setTimeout(() => {
      toggleFullscreen();
    }, 300);
    return () => window.clearTimeout(id);
  }, [autoFullscreen, toggleFullscreen]);

  useEffect(() => {
    if (!voiceEnabled || !data?.nowServing?.ticket) return;
    const current = data.nowServing.ticket;
    const previous = previousNowServingRef.current;
    if (previous === current) return;
    previousNowServingRef.current = current;

    const text = `Next patient ${formatVoiceTicket(current)}, please proceed to ${data.doctorOnDuty ?? `${data.department} consultation desk`}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-PH";
    utterance.rate = 0.95;
    const preferredVoice = pickPreferredVoice(window.speechSynthesis.getVoices());
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [data, voiceEnabled]);

  const title = useMemo(() => (department ? `${department} Queue Display` : "Department Queue Display"), [department]);

  if (loading && !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#e7f0ff] via-[#f5f8ff] to-[#f8fafc] px-4 py-6 text-[#212529] sm:px-8 lg:px-10">
        <section className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-5 rounded-3xl border border-[#d0def4] bg-white/95 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e7f0ff]">
            <Image
              src="/hqlogo.svg"
              alt="Health Queue PH"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              Preparing display
            </p>
            <h1
              className="mt-1 text-xl font-bold text-[#003566] sm:text-2xl"
              style={{ fontFamily: "var(--font-rosario), sans-serif" }}
            >
              Loading live queue screen…
            </h1>
            <p className="mt-2 text-sm text-[#64748b]">
              Please wait a moment while we fetch the latest queue data for this department.
            </p>
          </div>
          <div className="mt-2 h-9 w-9 animate-spin rounded-full border-2 border-[#007bff] border-t-transparent" aria-hidden />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#e7f0ff] via-[#f5f8ff] to-[#f8fafc] px-4 py-6 text-[#212529] sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col justify-center gap-6">
      <header className="w-full rounded-3xl border border-[#d0def4] bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur sm:p-7 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/"
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d0def4] bg-white shadow-sm"
            >
              <Image
                src="/hqlogo.svg"
                alt="Health Queue PH"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                Live Queue Display
              </p>
              <h1
                className="mt-1 truncate text-xl font-bold text-[#003566] sm:text-3xl md:text-4xl"
                style={{ fontFamily: "var(--font-rosario), sans-serif" }}
              >
                {title}
              </h1>
              <p className="mt-1 text-sm text-[#64748b]">
                Updated in real time for patients in the waiting area.
              </p>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setVoiceEnabled((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                voiceEnabled
                  ? "bg-[#007bff] text-white hover:bg-[#0069d9]"
                  : "border border-[#d0def4] bg-white text-[#1f2933] hover:bg-[#eff4ff]"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Voice {voiceEnabled ? "On" : "Off"}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d0def4] bg-white px-4 py-2.5 text-sm font-semibold text-[#1f2933] shadow-sm transition hover:bg-[#eff4ff]"
            >
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 text-sm text-[#4b5563] sm:grid-cols-3">
          <div className="rounded-2xl bg-[#f5f8ff] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
              Doctor on duty
            </p>
            <p className="mt-1 text-xl font-semibold text-[#111827]">
              {data?.doctorOnDuty ?? "No doctor on duty yet"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f5f8ff] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
              Patients waiting
            </p>
            <p className="mt-1 text-2xl font-bold text-[#111827]">
              {data?.waitingCount ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f5f8ff] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
              Last updated
            </p>
            <p className="mt-1 text-lg font-semibold text-[#111827]">
              {formatUpdateTime(data?.updatedAt ?? null)}
            </p>
          </div>
        </div>
      </header>

      {loading && (
        <section className="w-full rounded-3xl border border-[#d0def4] bg-white/95 p-10 text-center text-lg text-[#6C757D] shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
          Loading queue display...
        </section>
      )}

      {!loading && error && (
        <section className="w-full rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-lg text-red-700 shadow-[0_16px_50px_rgba(248,113,113,0.25)]">
          {error}
        </section>
      )}

      {!loading && !error && data && (
        <section className="w-full rounded-3xl border border-[#d0def4] bg-white/95 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.1)] sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="relative overflow-hidden rounded-2xl border border-[#dbe4ff] bg-gradient-to-br from-[#e0f2fe] via-white to-[#f5f8ff] p-4 shadow-sm sm:p-8 md:p-10">
              <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#93c5fd]/30 blur-2xl" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                Now Serving
              </p>
              <p className="mt-3 text-3xl font-extrabold text-[#0f172a] sm:text-5xl md:text-6xl">
                {data.nowServing?.ticket ?? "—"}
              </p>
              <p className="mt-3 text-sm text-[#4b5563]">
                Status: <span className="font-medium">{data.nowServing?.status ?? "Waiting"}</span>
              </p>
            </article>

            <article className="relative overflow-hidden rounded-2xl border border-[#dbe4ff] bg-gradient-to-br from-[#e0edff] via-white to-[#f5f8ff] p-4 shadow-sm sm:p-8 md:p-10">
              <div className="absolute -left-10 -bottom-16 h-40 w-40 rounded-full bg-[#bfdbfe]/40 blur-2xl" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
                Next Patient
              </p>
              <p className="mt-3 text-3xl font-extrabold text-[#0f172a] sm:text-5xl md:text-6xl">
                {data.nextUp?.ticket ?? "—"}
              </p>
              <p className="mt-3 text-sm text-[#4b5563]">
                Estimated wait:{" "}
                <span className="font-medium">{data.nextUp?.estimatedWait ?? "—"}</span>
              </p>
            </article>

            <article className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm sm:p-6 lg:p-7 lg:col-span-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
                Upcoming Queue
              </p>
              {data.upcoming.length === 0 ? (
                <p className="text-base text-[#6C757D]">No other waiting tickets right now.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {data.upcoming.map((item) => (
                    <div
                      key={item.ticket}
                      className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3"
                    >
                      <div>
                        <p className="text-lg font-semibold text-[#0f172a] sm:text-xl">
                          {item.ticket}
                        </p>
                        <p className="text-xs uppercase text-[#6C757D]">
                          {item.status}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-[#1f2933]">
                        {item.estimatedWait}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
        </section>
      )}
      </div>
    </main>
  );
}

function QueueDisplayFallback() {
  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-4 text-[#212529] sm:px-8 sm:py-6">
      <section className="rounded-2xl border border-[#dee2e6] bg-white p-8 text-center text-lg text-[#6C757D]">
        Loading queue display...
      </section>
    </main>
  );
}

export default function QueueDisplayPage() {
  return (
    <Suspense fallback={<QueueDisplayFallback />}>
      <QueueDisplayClient />
    </Suspense>
  );
}
