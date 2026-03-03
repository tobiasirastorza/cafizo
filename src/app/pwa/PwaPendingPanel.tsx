"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";

type PwaPendingPanelProps = {
  children: ReactNode;
  currentPanel: "training" | "history";
};

type NavigationStartDetail = {
  panel?: "training" | "history";
};

export default function PwaPendingPanel({ children, currentPanel }: PwaPendingPanelProps) {
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  const [pendingPanel, setPendingPanel] = useState<"training" | "history">(currentPanel);

  useEffect(() => {
    const onStart = (event: Event) => {
      const custom = event as CustomEvent<NavigationStartDetail>;
      setPendingPanel(custom.detail?.panel ?? currentPanel);
      setIsPending(true);
    };

    window.addEventListener("app:navigation-start", onStart);

    return () => {
      window.removeEventListener("app:navigation-start", onStart);
    };
  }, [currentPanel]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsPending(false);
      setPendingPanel(currentPanel);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchParams, currentPanel]);

  if (!isPending) return <>{children}</>;

  const isTraining = pendingPanel === "training";

  return (
    <section className="mt-4 border border-border bg-background-card rounded-lg p-5">
      {isTraining ? (
        <>
          <div className="mt-1 h-10 w-52 animate-pulse rounded-md bg-background-muted" />
          <div className="mt-4 h-40 animate-pulse rounded-lg border border-border bg-background-muted/50" />
          <div className="mt-3 h-40 animate-pulse rounded-lg border border-border bg-background-muted/50" />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-background-muted" />
              <div className="h-6 w-36 animate-pulse rounded bg-background-muted" />
            </div>
            <div className="h-7 w-28 animate-pulse rounded bg-background-muted" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-20 animate-pulse rounded-md border border-border bg-background-muted/50" />
            <div className="h-20 animate-pulse rounded-md border border-border bg-background-muted/50" />
          </div>
          <div className="mt-4 h-14 animate-pulse rounded-md border border-border bg-background-muted/50" />
          <div className="mt-2 h-14 animate-pulse rounded-md border border-border bg-background-muted/50" />
          <div className="mt-2 h-14 animate-pulse rounded-md border border-border bg-background-muted/50" />
        </>
      )}
    </section>
  );
}
