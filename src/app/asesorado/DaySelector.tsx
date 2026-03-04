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

const DAY_SELECTOR_DROPDOWN_THRESHOLD = 5;

export default function DaySelector({
  studentId,
  availableDays,
  selectedDayIndex,
  basePath = "/asesorado",
  extraParams,
}: DaySelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const useDayDropdown = availableDays.length > DAY_SELECTOR_DROPDOWN_THRESHOLD;

  const goToDay = (day: number) => {
    startTransition(() => {
      window.dispatchEvent(new CustomEvent("app:navigation-start", { detail: { panel: "training" } }));
      const params = new URLSearchParams({
        student: studentId,
        day: String(day),
        ...(extraParams ?? {}),
      });
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  if (useDayDropdown) {
    return (
      <div className="mt-4" aria-busy={isPending}>
        <label className="block">
          <select
            value={String(selectedDayIndex)}
            onChange={(e) => goToDay(Number(e.target.value))}
            disabled={isPending}
            className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent disabled:opacity-60"
            aria-label="Seleccionar día"
          >
            {availableDays.map((day) => (
              <option key={day} value={day}>
                {`Día ${day}`}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

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
