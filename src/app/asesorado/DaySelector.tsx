"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type DaySelectorProps = {
  studentId: string;
  availableDays: number[];
  selectedDayIndex: number;
  basePath?: string;
};

export default function DaySelector({
  studentId,
  availableDays,
  selectedDayIndex,
  basePath = "/asesorado",
}: DaySelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const goToDay = (day: number) => {
    startTransition(() => {
      router.push(`${basePath}?student=${studentId}&day=${day}`);
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
            disabled={isPending}
            className={`inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors duration-150 disabled:opacity-70 ${
              isActive
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-background-card text-foreground hover:bg-background-muted"
            }`}
          >
            {isPending && isActive ? "..." : `Día ${day}`}
          </button>
        );
      })}
    </div>
  );
}
