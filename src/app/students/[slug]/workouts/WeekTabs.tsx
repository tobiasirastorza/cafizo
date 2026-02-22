"use client";

import { useState } from "react";

type Entry = {
  id: string;
  exerciseName: string;
  muscleGroup?: string;
  sets?: number;
  reps?: string;
  weight?: number;
  status: "completed" | "skipped";
};

type WeekData = {
  week: string;
  entries: Entry[];
};

type WeekTabsProps = {
  data: WeekData[];
};

export function WeekTabs({ data }: WeekTabsProps) {
  const [activeWeek, setActiveWeek] = useState(data[0]?.week ?? "");

  const activeData = data.find((d) => d.week === activeWeek);
  const entries = activeData?.entries ?? [];
  const completedCount = entries.filter((e) => e.status === "completed").length;
  const skippedCount = entries.filter((e) => e.status === "skipped").length;

  return (
    <section className="mt-10">
      {/* Week tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {data.map(({ week }) => (
          <button
            key={week}
            onClick={() => setActiveWeek(week)}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] transition-colors duration-150 rounded-md ${
              activeWeek === week
                ? "bg-background-active text-foreground"
                : "border border-border bg-background-card text-foreground-secondary hover:bg-background-muted hover:text-foreground"
            }`}
          >
            {week}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-6 flex gap-4 text-sm">
        <span className="text-accent font-medium">{completedCount} completed</span>
        {skippedCount > 0 && (
          <span className="text-foreground-secondary">{skippedCount} skipped</span>
        )}
      </div>

      {/* Entries */}
      <div className="mt-6 border border-border rounded-lg overflow-hidden">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={`grid gap-4 p-4 md:grid-cols-[minmax(0,2fr)_100px_100px_100px_100px] ${
              index % 2 === 0 ? "bg-background-card" : "bg-background-muted/30"
            } ${index !== entries.length - 1 ? "border-b border-border" : ""}`}
          >
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                Exercise
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.exerciseName}
              </div>
              {entry.muscleGroup && (
                <div className="mt-1 text-xs uppercase tracking-[0.08em] text-foreground-muted">
                  {entry.muscleGroup}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                Sets
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.sets ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                Reps
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.reps ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                Weight
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.weight ? `${entry.weight}kg` : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                Status
              </div>
              <div
                className={`mt-1 text-sm font-medium ${
                  entry.status === "completed"
                    ? "text-accent"
                    : "text-foreground-secondary"
                }`}
              >
                {entry.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
