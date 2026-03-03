"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const fallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const stop = () => {
      setIsNavigating(false);
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };

    const start = () => {
      setIsNavigating(true);
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
      }
      fallbackTimerRef.current = window.setTimeout(() => {
        setIsNavigating(false);
        fallbackTimerRef.current = null;
      }, 4000);
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${nextUrl.pathname}${nextUrl.search}`;
      if (current === next) return;

      start();
    };

    const onSubmit = () => start();
    const onStartEvent = () => start();

    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("app:navigation-start", onStartEvent);

    return () => {
      stop();
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("app:navigation-start", onStartEvent);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsNavigating(false);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[120] h-1 transition-opacity duration-150 ${
        isNavigating ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      <div className="route-progress-bar h-full w-1/3 rounded-r-full bg-accent" />
    </div>
  );
}
