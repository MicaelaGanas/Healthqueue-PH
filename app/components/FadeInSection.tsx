"use client";

import { useEffect, useRef, useState } from "react";

type FadeInSectionProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay before starting animation (ms). Useful for stagger. */
  delay?: number;
  /** Root margin for IntersectionObserver (e.g. "0px 0px -40px 0px" to trigger when 40px from bottom). */
  rootMargin?: string;
};

export function FadeInSection({
  children,
  className = "",
  delay = 0,
  rootMargin = "0px 0px -50px 0px",
}: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || hasAnimated) return;
        if (delay > 0) {
          timeoutId = setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, delay);
        } else {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.1, rootMargin }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [delay, rootMargin, hasAnimated]);

  return (
    <div
      ref={ref}
      className={`${isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
  );
}
