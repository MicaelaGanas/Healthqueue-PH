"use client";

import type { LabItemSync } from "../../../../lib/labSyncStorage";

type LabSummaryCardsProps = {
  items: LabItemSync[];
};

export function LabSummaryCards({ items }: LabSummaryCardsProps) {
  const requested = items.filter((i) => i.status === "Requested").length;
  const processing = items.filter((i) => i.status === "Processing").length;
  const readyForReview = items.filter((i) => i.status === "Ready for Review").length;
  const released = items.filter((i) => i.status === "Released").length;

  const cards = [
    { label: "Requested", value: requested, color: "text-[#6C757D]" },
    { label: "Processing", value: processing, color: "text-[#e65100]" },
    { label: "Ready for Review", value: readyForReview, color: "text-[#007bff]" },
    { label: "Released", value: released, color: "text-[#2e7d32]" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-lg border border-[#dee2e6] bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[#6C757D]">
            {card.label}
          </p>
          <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
        </article>
      ))}
    </div>
  );
}
