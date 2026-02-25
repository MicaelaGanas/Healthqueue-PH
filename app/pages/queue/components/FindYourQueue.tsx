"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FindYourQueue() {
  const router = useRouter();
  const [queueNumber, setQueueNumber] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = queueNumber.trim() || "T1265";
    router.push(`/pages/queue/result?q=${encodeURIComponent(value)}`);
  }

  return (
    <section className="mt-8" aria-labelledby="find-queue-heading">
      <h2 id="find-queue-heading" className="text-lg font-bold text-[#333333]" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
        Find Your Queue
      </h2>
      <form onSubmit={handleSearch} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={queueNumber}
          onChange={(e) => setQueueNumber(e.target.value)}
          placeholder="Enter queue number (e.g., GC-099)"
          className="min-w-0 flex-1 rounded-lg border border-[#dee2e6] bg-white px-4 py-3 text-[#333333] placeholder-[#6C757D] focus:border-[#007bff] focus:outline-none focus:ring-1 focus:ring-[#007bff]"
          aria-label="Queue number"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-[#6C757D] px-6 py-3 font-medium text-white hover:bg-[#5a6268]"
        >
          Search
        </button>
      </form>
    </section>
  );
}
