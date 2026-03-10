"use client";

import { useState, useEffect } from "react";
import { FadeInSection } from "../../../components/FadeInSection";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

type AnnouncementType = "notice" | "info" | "alert";

type AnnouncementItem = { id: string; type: AnnouncementType; title: string; description: string; created_at: string; hidden?: boolean;};

const announcementStyles: Record<
  AnnouncementType,
  { pill: string; iconBg: string; icon: string; IconComponent: React.ComponentType<{ className?: string }> }
> = {
  notice: {
    pill: "bg-[#FFF4E5] text-[#92400e]",
    iconBg: "border-[#FDBA74] bg-[#FFFBEB]",
    icon: "text-[#EA580C]",
    IconComponent: CalendarIcon,
  },
  info: {
    pill: "bg-[#E0EDFF] text-[#1d4ed8]",
    iconBg: "border-[#93C5FD] bg-[#EFF6FF]",
    icon: "text-[#2563EB]",
    IconComponent: ChatBubbleIcon,
  },
  alert: {
    pill: "bg-[#FEE2E2] text-[#B91C1C]",
    iconBg: "border-[#FCA5A5] bg-[#FEF2F2]",
    icon: "text-[#DC2626]",
    IconComponent: AlertCircleIcon,
  },
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

export function Announcements() {
  const [list, setList] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const visibleList = list.filter((item) => !item.hidden);


  useEffect(() => {
    let cancelled = false;
    fetch("/api/announcements")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setList(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  
  return (
    <section className="border-t border-[#E2E8F0] bg-[#F5F8FF] pt-12 pb-20 sm:pt-16 sm:pb-24" aria-labelledby="announcements-heading">
      <FadeInSection className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <h2
            id="announcements-heading"
            className="text-2xl font-bold text-[#0f172a] sm:text-3xl"
            style={{ fontFamily: "var(--font-rosario), sans-serif" }}
          >
            Announcements
          </h2>
          <p className="mt-1 text-sm text-[#6C757D]">Important updates and notices</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#2563EB] shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            <span>Stay updated with the latest clinic information</span>
          </div>
        </div>

        <div className="mt-8 min-h-[28rem]">
          {loading ? (
            <p className="py-12 text-sm text-[#6C757D]">Loading announcements…</p>
          ) : visibleList.length === 0 ? (
            <p className="font-medium text-center py-12 text-xl text-[#6C757D]">
              No announcements at the moment.
            </p>
          ) : (
            <div className="space-y-4">
              {visibleList.map((item, i) => {
                const style = announcementStyles[item.type] ?? announcementStyles.info;
                const Icon = style.IconComponent;
                return (
                  <FadeInSection key={item.id} delay={i * 80}>
                    <article className="flex gap-4 rounded-2xl border border-[#E2E8F0] bg-white/95 p-4 shadow-sm ring-1 ring-transparent transition duration-200 hover:-translate-y-1.5 hover:border-[#BFDBFE] hover:ring-[#DBEAFE] hover:shadow-[0_14px_40px_rgba(15,23,42,0.18)] sm:p-5">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${style.iconBg}`}
                      >
                        <Icon className={`h-5 w-5 ${style.icon}`} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.pill}`}>
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </span>
                          <p className="text-xs text-[#6C757D]">{formatDate(item.created_at)}</p>
                        </div>
                        <h3
                          className="mt-1 font-semibold text-[#0f172a]"
                          style={{ fontFamily: "var(--font-rosario), sans-serif" }}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-[#4B5563]">{item.description}</p>
                      </div>
                    </article>
                  </FadeInSection>
                );
              })}
            </div>
          )}
        </div>
      </FadeInSection>
    </section>
  );
}
