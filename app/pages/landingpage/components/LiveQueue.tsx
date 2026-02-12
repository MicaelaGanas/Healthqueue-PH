function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

const queueDepartments = [
  { name: "General Consultation", waiting: 24, waitTime: "~25 min", status: "Normal" as const },
  { name: "Emergency Room", waiting: 8, waitTime: "~10 min", status: "Busy" as const },
  { name: "Laboratory", waiting: 15, waitTime: "~20 min", status: "Normal" as const },
  { name: "Pharmacy", waiting: 32, waitTime: "~15 min", status: "Busy" as const },
  { name: "X-Ray / Imaging", waiting: 6, waitTime: "~30 min", status: "Normal" as const },
  { name: "Pediatrics", waiting: 12, waitTime: "~35 min", status: "Normal" as const },
];

export function LiveQueue() {
  return (
    <section id="live-queue" className="border-t border-[#E9ECEF] bg-[#f8f9fa] py-12 sm:py-16" aria-labelledby="queue-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header: title + subtitle left, "Updated just now" with green dot right */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="queue-heading" className="text-2xl font-bold text-[#333333] sm:text-3xl">
              Live Queue Status
            </h2>
            <p className="mt-1 text-sm text-[#6C757D]">Real-time waiting information</p>
          </div>
          <div className="flex items-center gap-2 text-[#6C757D]">
            <span className="h-2 w-2 rounded-full bg-[#4CAF50]" aria-hidden />
            <span className="text-sm">Updated just now</span>
          </div>
        </div>

        {/* Cards: 3x2 grid, white, rounded, shadow; status badge top-right */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queueDepartments.map((dept) => (
            <article
              key={dept.name}
              className="relative rounded-xl border border-[#e9ecef] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            >
              {/* Status badge: top right corner */}
              <span
                className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-medium text-white ${
                  dept.status === "Busy" ? "bg-[#EF5350]" : "bg-[#4CAF50]"
                }`}
              >
                {dept.status}
              </span>

              <h3 className="pr-20 text-base font-semibold text-[#333333]">{dept.name}</h3>

              <div className="mt-3 flex items-center gap-2 text-[#333333]">
                <UsersIcon className="h-5 w-5 shrink-0 text-[#6C757D]" />
                <span>
                  <span className="font-bold">{dept.waiting}</span>
                  <span className="ml-1 text-[#6C757D]">waiting</span>
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-[#6C757D]">
                <ClockIcon className="h-4 w-4 shrink-0" />
                <span className="text-sm">{dept.waitTime}</span>
              </div>
            </article>
          ))}
        </div>

        {/* Disclaimer: light orange-yellow box, warning icon, bold title + body */}
        <div className="mt-8 flex gap-4 rounded-xl bg-[#FFF3E0] p-4">
          <ExclamationIcon className="h-6 w-6 shrink-0 text-[#FFC107]" />
          <div>
            <p className="font-bold text-[#333333]">Wait times are estimates</p>
            <p className="mt-1 text-sm text-[#333333]">
              Actual wait times may vary based on emergency cases and patient priority. Emergency cases are always prioritized.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
