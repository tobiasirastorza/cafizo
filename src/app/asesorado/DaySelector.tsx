"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type DaySelectorProps = {
  studentId: string;
  availableDays: number[];
  selectedDayIndex: number;
  basePath?: string;
  extraParams?: Record<string, string>;
};

export default function DaySelector({
  studentId,
  availableDays,
  selectedDayIndex,
  basePath = "/asesorado",
  extraParams,
}: DaySelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const goToDay = (day: number) => {
    startTransition(() => {
      window.dispatchEvent(new Event("app:navigation-start"));
      const params = new URLSearchParams({
        student: studentId,
        day: String(day),
        ...(extraParams ?? {}),
      });
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2" aria-busy={isPending}>
      {availableDays.map((day) => {
        const isActive = day === selectedDayIndex;
        return (
          <button
            key={day}
            type="button"
            onClick={() => goToDay(day)}
            className={`inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-background-card text-foreground hover:bg-background-muted"
            }`}
          >
            {`Día ${day}`}
          </button>
        );
      })}
    </div>
  );
}
