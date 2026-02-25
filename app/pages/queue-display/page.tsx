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
      const res = await fetch(`/api/landing/department-display?department=${encodeURIComponent(department)}`, {
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

    const text = `Next patient ${formatVoiceTicket(current)}, please proceed to ${data.doctorOnDuty ?? "the doctor"}, ${data.department}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-PH";
    utterance.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [data, voiceEnabled]);

  const title = useMemo(() => (department ? `${department} Queue Display` : "Department Queue Display"), [department]);

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-6 text-[#212529] sm:px-8 lg:px-10">
      <header className="mx-auto mb-6 w-full max-w-7xl rounded-2xl border border-[#dee2e6] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#dee2e6] bg-white">
              <Image
                src="/hqlogo.svg"
                alt="Health Queue PH"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-[#333333] sm:text-4xl">{title}</h1>
              <p className="text-base text-[#6C757D]">Live queue display for patients</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVoiceEnabled((v) => !v)}
              className={`rounded-lg px-4 py-2.5 text-base font-medium ${voiceEnabled ? "bg-[#007bff] text-white hover:bg-[#0056b3]" : "border border-[#dee2e6] bg-white text-[#333333] hover:bg-[#f8f9fa]"}`}
            >
              Voice {voiceEnabled ? "On" : "Off"}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-lg border border-[#dee2e6] bg-white px-4 py-2.5 text-base font-medium text-[#333333] hover:bg-[#f8f9fa]"
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 text-lg text-[#6C757D] sm:grid-cols-3">
          <div className="rounded-xl bg-[#f8f9fa] px-5 py-4">Doctor: <strong className="text-xl text-[#333333]">{data?.doctorOnDuty ?? "On duty"}</strong></div>
          <div className="rounded-xl bg-[#f8f9fa] px-5 py-4">Waiting: <strong className="text-xl text-[#333333]">{data?.waitingCount ?? 0}</strong></div>
          <div className="rounded-xl bg-[#f8f9fa] px-5 py-4">Updated: <strong className="text-xl text-[#333333]">{formatUpdateTime(data?.updatedAt ?? null)}</strong></div>
        </div>
      </header>

      {loading && (
        <section className="mx-auto w-full max-w-7xl rounded-2xl border border-[#dee2e6] bg-white p-8 text-center text-lg text-[#6C757D]">
          Loading queue display...
        </section>
      )}

      {!loading && error && (
        <section className="mx-auto w-full max-w-7xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-lg text-red-700">
          {error}
        </section>
      )}

      {!loading && !error && data && (
        <section className="mx-auto w-full max-w-7xl rounded-2xl border border-[#dee2e6] bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-[#e9ecef] bg-white p-6 shadow-sm sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#28a745]">Now Serving</p>
              <p className="mt-2 text-5xl font-extrabold text-[#333333] sm:text-7xl">{data.nowServing?.ticket ?? "—"}</p>
              <p className="mt-2 text-sm text-[#6C757D]">Status: {data.nowServing?.status ?? "Waiting"}</p>
            </article>

            <article className="rounded-2xl border border-[#e9ecef] bg-white p-6 shadow-sm sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#007bff]">Next Patient</p>
              <p className="mt-2 text-5xl font-extrabold text-[#333333] sm:text-7xl">{data.nextUp?.ticket ?? "—"}</p>
              <p className="mt-2 text-sm text-[#6C757D]">Estimated wait: {data.nextUp?.estimatedWait ?? "—"}</p>
            </article>

            <article className="rounded-2xl border border-[#e9ecef] bg-white p-5 shadow-sm sm:p-8 lg:col-span-2">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#6C757D]">Upcoming Queue</p>
              {data.upcoming.length === 0 ? (
                <p className="text-base text-[#6C757D]">No other waiting tickets right now.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {data.upcoming.map((item) => (
                    <div
                      key={item.ticket}
                      className="flex items-center justify-between rounded-xl border border-[#e9ecef] bg-[#f8f9fa] px-4 py-3"
                    >
                      <div>
                        <p className="text-xl font-semibold text-[#333333]">{item.ticket}</p>
                        <p className="text-xs uppercase text-[#6C757D]">{item.status}</p>
                      </div>
                      <p className="text-sm font-medium text-[#333333]">{item.estimatedWait}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
        </section>
      )}
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
