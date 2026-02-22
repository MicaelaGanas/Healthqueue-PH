"use client";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80";

export function HeroBanner() {
  return (
    <section
      className="relative min-h-[280px] overflow-hidden bg-[#0f172a] sm:min-h-[320px]"
      aria-label="Hero"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}
      />
      <div
        className="absolute inset-0 bg-[#0f172a]/80"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-[280px] max-w-7xl flex-col items-center justify-center px-4 py-12 text-center sm:min-h-[320px] sm:px-6">
        <h1
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
          style={{ fontFamily: "var(--font-rosario), sans-serif" }}
        >
          HealthQueue PH
        </h1>
        <p className="mt-3 text-base font-medium text-white/90 sm:text-lg">
          Queue smarter, wait less.
        </p>
      </div>
    </section>
  );
}
