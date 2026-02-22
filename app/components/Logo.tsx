import Link from "next/link";
import Image from "next/image";

const DARK_BLUE = "#183172";

type LogoProps = {
  variant?: "default" | "footer";
  className?: string;
};

export function Logo({ variant = "default", className = "" }: LogoProps) {
  const isFooter = variant === "footer";
  const size = isFooter ? 40 : 48;
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/hqlogo.svg"
        alt=""
        width={size}
        height={size}
        className={`shrink-0 object-contain ${isFooter ? "h-10 w-10" : "h-12 w-12"}`}
        aria-hidden
      />
      <span className="flex flex-col items-start leading-tight">
        <span
          className="font-semibold uppercase tracking-tight"
          style={{ fontFamily: "var(--font-rosario), sans-serif", color: DARK_BLUE }}
        >
          Health Queue PH
        </span>
        {!isFooter && (
          <span
            className="text-sm font-normal"
            style={{ fontFamily: "Helvetica, Arial, sans-serif", color: DARK_BLUE }}
          >
            Queue smarter, wait less.
          </span>
        )}
      </span>
    </Link>
  );
}
