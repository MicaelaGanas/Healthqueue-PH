"use client";

export function LabHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#dee2e6] bg-white px-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold leading-tight text-[#333333] sm:text-lg">
          Laboratory Dashboard
        </h1>
        <p className="mt-0.5 truncate text-xs leading-tight text-[#6C757D] sm:text-sm">
          Specimens, processing & results
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="h-8 w-px shrink-0 bg-[#e9ecef]" aria-hidden />
        <div className="flex items-center gap-3 pl-2 sm:pl-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#007bff] text-sm font-bold text-white">
            LB
          </div>
          <div className="min-w-0 max-w-[140px] sm:max-w-[180px]">
            <p className="truncate text-sm font-medium leading-tight text-[#333333]">
              Lab User
            </p>
            <p className="truncate text-xs leading-tight text-[#6C757D]">
              Laboratory
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
