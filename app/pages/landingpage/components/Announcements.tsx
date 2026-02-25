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

const announcementStyles: Record<AnnouncementType, { pill: string; iconBg: string; icon: string; IconComponent: React.ComponentType<{ className?: string }> }> = {
  notice: { pill: "bg-[#FFF3E0] text-[#333333]", iconBg: "border-[#FFC107]", icon: "text-[#FFC107]", IconComponent: CalendarIcon },
  info: { pill: "bg-[#E0EDFF] text-[#333333]", iconBg: "border-[#1877F2]", icon: "text-[#1877F2]", IconComponent: ChatBubbleIcon },
  alert: { pill: "bg-[#FFEBEE] text-[#333333]", iconBg: "border-[#EF5350]", icon: "text-[#EF5350]", IconComponent: AlertCircleIcon },
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
    <section className="border-t border-[#E9ECEF] bg-[#F8F9FB] py-12 sm:py-16" aria-labelledby="announcements-heading">
      <FadeInSection className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 id="announcements-heading" className="text-2xl font-bold text-[#333333] sm:text-3xl" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>Announcements</h2>
        <p className="mt-1 text-[#6C757D]">Important updates and notices</p>
        <div className="mt-8 min-h-[28rem]">
          {loading ? (
            <p className="py-12 text-sm text-[#6C757D]">Loading announcements…</p>
          ) : visibleList.length === 0 ? (
            <p className="font-medium text-center py-12 text-xl text-[#6C757D]">No announcements at the moment.</p>
          ) : (
            <div className="space-y-4">
              {visibleList.map((item, i) => {
                const style = announcementStyles[item.type] ?? announcementStyles.info;
                const Icon = style.IconComponent;
                return (
                  <FadeInSection key={item.id} delay={i * 80}>
                    <article className="flex gap-4 rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 bg-white ${style.iconBg}`}>
                        <Icon className={`h-5 w-5 ${style.icon}`} />
                      </div>
                      <div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.pill}`}>
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                        <p className="mt-1 text-xs text-[#6C757D]">{formatDate(item.created_at)}</p>
                        <h3 className="mt-1 font-semibold text-[#333333]" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>{item.title}</h3>
                        <p className="mt-2 text-sm text-[#6C757D]">{item.description}</p>
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
