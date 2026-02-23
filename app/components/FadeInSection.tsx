"use client";

import { useEffect, useState } from "react";

type FadeInSectionProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay before starting animation (ms). Useful for stagger. */
  delay?: number;
  /** Root margin for IntersectionObserver (e.g. "0px 0px -40px 0px" to trigger when 40px from bottom). */
  rootMargin?: string;
  /** If true, only animate once and stop observing after first reveal. */
  once?: boolean;
};

export function FadeInSection({
  children,
  className = "",
  delay = 0,
  rootMargin = "0px 0px -50px 0px",
  once = true,
}: FadeInSectionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (delay > 0) {
      timeoutId = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [delay]);

  return (
    <div
      className={`${isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
  );
}
