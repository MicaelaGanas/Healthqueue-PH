"use client";

const cards = [
  {
    label: "Today's Total",
    value: "8",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: "text-[#007bff]",
  },
  {
    label: "Confirmed",
    value: "3",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-green-600",
  },
  {
    label: "Completed",
    value: "1",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-[#007bff]",
  },
  {
    label: "Cancelled/No-show",
    value: "2",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    color: "text-red-600",
  },
];

export function AppointmentsSummaryCards() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex items-center gap-4 rounded-lg border border-[#e9ecef] bg-white p-4 shadow-sm"
        >
          <div className={c.color}>{c.icon}</div>
          <div>
            <p className="text-2xl font-bold text-[#333333]">{c.value}</p>
            <p className="text-sm text-[#6C757D]">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
