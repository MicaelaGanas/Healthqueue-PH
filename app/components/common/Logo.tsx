import Link from "next/link";

/** Blue square with white ECG / heartbeat line */
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="32" height="32" rx="6" fill="currentColor" />
      <path
        d="M6 16h3l1.5-3 1.5 6 3-9 3 4.5 3-4.5 3 3"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type LogoProps = {
  variant?: "default" | "footer";
  className?: string;
};

export function Logo({ variant = "default", className = "" }: LogoProps) {
  const isFooter = variant === "footer";
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`}>
      <LogoIcon className={`shrink-0 text-[#007bff] ${isFooter ? "h-8 w-8" : "h-9 w-9"}`} />
      <span className="flex flex-col leading-tight">
        <span className="font-semibold text-black">HealthQueue</span>
        <span className={`font-semibold text-[#007bff] ${isFooter ? "text-xs" : "text-sm"}`}>PH</span>
      </span>
    </Link>
  );
}
