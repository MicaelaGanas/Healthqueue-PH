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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

const departments = [
  { name: "General Consultation", waiting: 24, estWait: "25 min", nowServing: "GC-087" },
  { name: "Emergency Room", waiting: 8, estWait: "10 min", nowServing: "ER-034" },
  { name: "Laboratory", waiting: 15, estWait: "20 min", nowServing: "LB-156" },
  { name: "Pharmacy", waiting: 32, estWait: "15 min", nowServing: "PH-201" },
  { name: "X-Ray / Imaging", waiting: 6, estWait: "30 min", nowServing: "XR-045" },
  { name: "Pediatrics", waiting: 12, estWait: "35 min", nowServing: "PD-023" },
  { name: "OB-GYN", waiting: 9, estWait: "40 min", nowServing: "OB-018" },
  { name: "Dental", waiting: 5, estWait: "20 min", nowServing: "DN-012" },
];

export function LiveQueueStatusSection() {
  return (
    <section className="mt-10" aria-labelledby="live-queue-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="live-queue-heading" className="text-lg font-bold text-[#333333]">
            Live Queue Status
          </h2>
          <p className="mt-1 text-sm text-[#6C757D]">Current wait times by department</p>
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-[#6C757D] hover:bg-[#e9ecef]"
          aria-label="Search or filter departments"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {departments.map((dept) => (
          <article
            key={dept.name}
            className="rounded-xl border border-[#e9ecef] bg-white p-4 shadow-sm"
          >
            <h3 className="font-semibold text-[#333333]">{dept.name}</h3>
            <div className="mt-3 flex items-center gap-2 text-sm text-[#6C757D]">
              <UsersIcon className="h-4 w-4 shrink-0" />
              <span>Waiting</span>
              <span className="font-semibold text-[#333333]">{dept.waiting}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-[#6C757D]">
              <ClockIcon className="h-4 w-4 shrink-0" />
              <span>Est. Wait</span>
              <span className="text-[#333333]">{dept.estWait}</span>
            </div>
            <p className="mt-3 text-sm">
              <span className="text-[#6C757D]">Now Serving</span>{" "}
              <span className="font-medium text-[#007bff] underline">{dept.nowServing}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
