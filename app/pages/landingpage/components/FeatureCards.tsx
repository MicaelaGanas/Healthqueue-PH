import Link from "next/link";

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

const cardShadow = "shadow-[0_2px_8px_rgba(0,0,0,0.08)]";

export function FeatureCards() {
  return (
    <section className="py-12 sm:py-16" aria-labelledby="actions-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <article className={`flex flex-col items-center rounded-xl border border-[#e9ecef] bg-white p-6 text-center ${cardShadow}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#007bff] bg-[#E0EDFF]">
              <SearchIcon className="h-6 w-6 text-[#007bff]" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#212529]">Check Queue</h2>
            <p className="mt-2 max-w-[200px] text-sm leading-snug text-[#6c757d]">View your current queue position and wait time.</p>
            <Link href="#check-queue" className="mt-4 inline-block rounded-lg bg-[#007bff] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#0069d9]">
              Check Now
            </Link>
          </article>
          <article className={`flex flex-col items-center rounded-xl border border-[#e9ecef] bg-white p-6 text-center ${cardShadow}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#2e7d32] bg-[#E8F5E9]">
              <CalendarPlusIcon className="h-6 w-6 text-[#2e7d32]" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#212529]">Book Appointment</h2>
            <p className="mt-2 max-w-[200px] text-sm leading-snug text-[#6c757d]">Schedule a visit to reduce wait time.</p>
            <Link href="#book-appointment" className="mt-4 inline-block rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-4 py-2.5 text-sm font-medium text-[#212529] hover:bg-[#e9ecef]">
              Book Now
            </Link>
          </article>
          <article className={`flex flex-col items-center rounded-xl border border-[#e9ecef] bg-white p-6 text-center ${cardShadow}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#e65100] bg-[#FFF3E0]">
              <ClockIcon className="h-6 w-6 text-[#e65100]" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#212529]">Wait Times</h2>
            <p className="mt-2 max-w-[200px] text-sm leading-snug text-[#6c757d]">View estimated wait times by department.</p>
            <Link href="#live-queue" className="mt-4 inline-block rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-4 py-2.5 text-sm font-medium text-[#212529] hover:bg-[#e9ecef]">
              View Times
            </Link>
          </article>
          <article className={`flex flex-col items-center rounded-xl border border-[#e9ecef] bg-white p-6 text-center ${cardShadow}`}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#007bff] bg-[#E0EDFF]">
              <MapPinIcon className="h-6 w-6 text-[#007bff]" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#212529]">Directory</h2>
            <p className="mt-2 max-w-[200px] text-sm leading-snug text-[#6c757d]">Find departments and service locations.</p>
            <Link href="#directory" className="mt-4 inline-block rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-4 py-2.5 text-sm font-medium text-[#212529] hover:bg-[#e9ecef]">
              View Map
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
