"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type ExerciseEntry = {
  id: string;
  name: string;
  muscle_group: string;
  exercise_type: string;
  sets: number;
  reps: string;
};

type RoutineData = {
  id: string;
  name: string;
  level: string;
  split: string;
  days_per_week: number;
  exercisesByDay: Record<number, ExerciseEntry[]>;
};

type RoutineCardProps = {
  routine: RoutineData;
};

export function RoutineCard({ routine }: RoutineCardProps) {
  const t = useTranslations("Routines");
  const [expanded, setExpanded] = useState(false);
  const showSplit =
    Boolean(routine.split?.trim()) &&
    routine.split.trim().toLowerCase() !== routine.name.trim().toLowerCase();

  const days = Object.keys(routine.exercisesByDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="border border-border bg-background-card rounded-lg p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
            <span className="bg-background-muted px-2 py-1 text-foreground rounded">
              {routine.level}
            </span>
            {showSplit ? <span>{routine.split}</span> : null}
          </div>
          <div className="mt-3 text-xl font-semibold leading-tight text-foreground md:text-2xl">
            {routine.name}
          </div>
          <div className="mt-2 text-xs uppercase tracking-[0.08em] text-foreground-muted">
            {t("daysPerWeek", { count: routine.days_per_week })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-10 border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
          >
            {expanded ? t("actions.collapse") : t("actions.expand")}
          </button>
          <button className="h-10 border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90">
            {t("actions.assign")}
          </button>
          <button className="h-10 border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted">
            {t("actions.edit")}
          </button>
          <button className="h-10 border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted">
            {t("actions.duplicate")}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 space-y-4">
          {days.map((day) => (
            <div key={day} className="border border-border rounded-lg overflow-hidden">
              <div className="border-b border-border bg-background-muted px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] text-foreground-label">
                Day {day}
              </div>
              <div>
                {routine.exercisesByDay[day].map((ex, idx) => (
                  <div
                    key={ex.id}
                    className={`flex items-center justify-between gap-4 px-4 py-3 border-b last:border-b-0 border-border ${idx % 2 === 1 ? "bg-background-muted/30" : "bg-background-card"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">
                        {ex.name}
                      </span>
                      <span className="text-xs uppercase tracking-[0.08em] text-foreground-muted">
                        {ex.muscle_group}
                      </span>
                      <span className="text-xs font-medium text-accent">
                        {ex.exercise_type}
                      </span>
                    </div>
                    <div className="text-sm text-foreground-secondary">
                      {ex.sets} × {ex.reps}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
