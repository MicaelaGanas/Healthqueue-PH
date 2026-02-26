"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FadeInSection } from "../../../components/FadeInSection";
import { createSupabaseBrowser, getSessionOrSignOut } from "../../../lib/supabase/client";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function CalendarPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v4m0 0v-4m0 0h4m-4 0H8" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function FeatureCards() {
  const [checkQueueHref, setCheckQueueHref] = useState("/pages/queue");

  useEffect(() => {
    let cancelled = false;

    const resolveCheckQueueHref = async () => {
      try {
        const cachedUserType = sessionStorage.getItem("user_type_cache");
        if (cachedUserType === "patient") {
          if (!cancelled) setCheckQueueHref("/pages/patient-dashboard?tab=queue");
          return;
        }

        if (cachedUserType === "staff") {
          if (!cancelled) setCheckQueueHref("/pages/queue");
          return;
        }

        const supabase = createSupabaseBrowser();
        const { session } = await getSessionOrSignOut(supabase);

        if (!session?.access_token) {
          if (!cancelled) setCheckQueueHref("/pages/queue");
          return;
        }

        const res = await fetch("/api/patient-users", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok) {
          sessionStorage.setItem("user_type_cache", "patient");
          if (!cancelled) setCheckQueueHref("/pages/patient-dashboard?tab=queue");
          return;
        }

        sessionStorage.setItem("user_type_cache", "staff");
        if (!cancelled) setCheckQueueHref("/pages/queue");
      } catch {
        if (!cancelled) setCheckQueueHref("/pages/queue");
      }
    };

    resolveCheckQueueHref();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      title: "Check Queue",
      description: "View your current queue position and wait time.",
      href: checkQueueHref,
      cta: "Check Now",
      primary: true,
      icon: SearchIcon,
    },
    {
      title: "Book Appointment",
      description: "Schedule a visit to reduce wait time.",
      href: "/pages/book",
      cta: "Book Now",
      primary: false,
      icon: CalendarPlusIcon,
    },
    {
      title: "Wait Times",
      description: "Estimated wait times by department.",
      href: "#live-queue",
      cta: "View Times",
      primary: false,
      icon: ClockIcon,
    },
    {
      title: "Directory",
      description: "Departments and service locations.",
      href: "/pages/directory",
      cta: "View Map",
      primary: false,
      icon: MapPinIcon,
    },
  ];

  return (
    <FadeInSection className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 pb-14 sm:px-6">
      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="sr-only">
          Get started
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isHash = card.href.startsWith("#");
            return (
              <FadeInSection key={card.title} delay={index * 80}>
                <article
                  className="group flex flex-col items-center text-center rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
                >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#007bff]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#0f172a]" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
                {card.title}
              </h3>
              <p className="mt-1.5 text-sm text-[#64748b] leading-snug line-clamp-2 min-h-[2.75rem]">
                {card.description}
              </p>
              <div className="mt-5 flex-1" />
              {isHash ? ( 
                <a
                  href={card.href}
                  className={`mt-4 w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${
                    card.primary
                      ? "bg-[#007bff] text-white hover:bg-[#0069d9]"
                      : "border border-[#e2e8f0] text-[#334155] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                  }`}
                >
                  {card.cta}
                </a>
              ) : (
              <Link
                href={card.href}
                className={`mt-4 w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${
                  card.primary
                    ? "bg-[#007bff] text-white hover:bg-[#0069d9]"
                    : "border border-[#e2e8f0] text-[#334155] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                }`}
              >
                {card.cta}
              </Link>
              )}
                </article>
              </FadeInSection>
            );
          })}
        </div>
      </section>
    </FadeInSection>
  );
}
