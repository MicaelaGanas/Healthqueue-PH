"use client";

export function StaffHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#dee2e6] bg-white px-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold leading-tight text-[#333333] sm:text-lg">
          Hospital Dashboard
        </h1>
        <p className="mt-0.5 truncate text-xs leading-tight text-[#6C757D] sm:text-sm">
          Manila General Hospital
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6C757D] transition-colors hover:bg-[#e9ecef] hover:text-[#333333] sm:h-10 sm:w-10"
          aria-label="Notifications"
        >
          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-6-6v0a6 6 0 00-6 6v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute right-0 top-0 flex h-4 min-w-[1rem] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <div className="h-8 w-px shrink-0 bg-[#e9ecef]" aria-hidden />
        <div className="flex items-center gap-3 pl-2 sm:pl-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#007bff] text-sm font-bold text-white">
            AD
          </div>
          <div className="min-w-0 max-w-[140px] sm:max-w-[180px]">
            <p className="truncate text-sm font-medium leading-tight text-[#333333]">
              Admin User
            </p>
            <p className="truncate text-xs leading-tight text-[#6C757D]">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
