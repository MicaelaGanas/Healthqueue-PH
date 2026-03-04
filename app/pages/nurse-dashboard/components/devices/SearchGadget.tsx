import React from "react";

type SearchGadgetProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchGadget({ value, onChange }: SearchGadgetProps) {
  return (
    <div className="relative mt-5">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D]">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search for Device ID or Patient Name"
        className="w-full bg-white rounded-lg border border-[#dee2e6] py-2 pl-10 pr-3 
      text-sm text-[#333333] placeholder:text-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
      />
    </div>
  );
}