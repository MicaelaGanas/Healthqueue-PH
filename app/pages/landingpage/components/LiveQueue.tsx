"use client";

import { FadeInSection } from "../../../components/FadeInSection";
import { LiveQueueStatusGrid } from "../../../components/LiveQueueStatusGrid";

function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

export function LiveQueue() {
  return (
    <section id="live-queue" className="border-t border-[#E9ECEF] bg-[#f8f9fa] py-12 sm:py-16" aria-labelledby="live-queue-heading">
      <FadeInSection className="mx-auto max-w-7xl px-4 sm:px-6">
        <LiveQueueStatusGrid variant="landing" sectionId="live-queue-grid" />

        {/* Disclaimer */}
        <div className="mt-8 flex gap-4 rounded-xl bg-[#FFF3E0] p-4">
          <ExclamationIcon className="h-6 w-6 shrink-0 text-[#FFC107]" />
          <div>
            <p className="font-bold text-[#333333]">Wait times are estimates</p>
            <p className="mt-1 text-sm text-[#333333]">
              Actual wait times may vary based on emergency cases and patient priority. Emergency cases are always prioritized.
            </p>
          </div>
        </div>
      </FadeInSection>
    </section>
  );
}
