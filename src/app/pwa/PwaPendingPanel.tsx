"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import Skeleton from "@/app/components/Skeleton";

type PwaPendingPanelProps = {
  children: ReactNode;
  currentPanel: "classes" | "training" | "history";
};

type NavigationStartDetail = {
  panel?: "classes" | "training" | "history";
};

export default function PwaPendingPanel({ children, currentPanel }: PwaPendingPanelProps) {
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  const [pendingPanel, setPendingPanel] = useState<"classes" | "training" | "history">(
    currentPanel,
  );

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

  if (!isPending) {
    return (
      <div key={`${currentPanel}-${searchParams?.toString() ?? ""}`} className="fade-in-up">
        {children}
      </div>
    );
  }

  return (
    <section className="mt-4 border border-border bg-background-card rounded-lg p-5">
      {pendingPanel === "training" ? <TrainingSkeleton /> : null}
      {pendingPanel === "classes" ? <ClassesSkeleton /> : null}
      {pendingPanel === "history" ? <HistorySkeleton /> : null}
    </section>
  );
}

function TrainingSkeleton() {
  return (
    <>
      <div className="mt-1 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-16" />
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border border-border rounded-md p-3 border-l-4 border-l-border bg-background-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ClassesSkeleton() {
  return (
    <>
      <Skeleton className="h-4 w-24" soft />
      <Skeleton className="mt-2 h-6 w-44" />
      <div className="mt-4 flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="border border-border rounded-md p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function HistorySkeleton() {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" soft />
          <Skeleton className="h-6 w-36" />
        </div>
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="border border-border rounded-md p-3 space-y-2">
          <Skeleton className="h-3 w-20" soft />
          <Skeleton className="h-7 w-12" />
        </div>
        <div className="border border-border rounded-md p-3 space-y-2">
          <Skeleton className="h-3 w-20" soft />
          <Skeleton className="h-7 w-12" />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="border border-border rounded-md p-3 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" soft />
          </div>
        ))}
      </div>
    </>
  );
}
