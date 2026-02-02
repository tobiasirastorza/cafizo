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

  const days = Object.keys(routine.exercisesByDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <span className="bg-muted px-3 py-1 text-foreground">
              {routine.level}
            </span>
            <span>{routine.split}</span>
          </div>
          <div className="mt-3 text-[clamp(1.5rem,4vw,2.5rem)] font-bold uppercase leading-[0.9] tracking-tighter text-foreground">
            {routine.name}
          </div>
          <div className="mt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {t("daysPerWeek", { count: routine.days_per_week })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-10 border-2 border-border px-4 text-sm font-bold uppercase tracking-widest text-foreground hover:bg-muted"
          >
            {expanded ? t("actions.collapse") : t("actions.expand")}
          </button>
          <button className="h-10 border-2 border-accent bg-accent px-4 text-sm font-bold uppercase tracking-widest text-accent-foreground">
            {t("actions.assign")}
          </button>
          <button className="h-10 border-2 border-border px-4 text-sm font-bold uppercase tracking-widest text-foreground hover:bg-muted">
            {t("actions.edit")}
          </button>
          <button className="h-10 border-2 border-border px-4 text-sm font-bold uppercase tracking-widest text-foreground hover:bg-muted">
            {t("actions.duplicate")}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 space-y-4">
          {days.map((day) => (
            <div key={day} className="border border-border">
              <div className="border-b border-border bg-muted/50 px-4 py-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Day {day}
              </div>
              <div className="divide-y divide-border">
                {routine.exercisesByDay[day].map((ex, idx) => (
                  <div
                    key={ex.id}
                    className={`flex items-center justify-between gap-4 px-4 py-3 ${idx % 2 === 1 ? "bg-muted/20" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-foreground">
                        {ex.name}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {ex.muscle_group}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-accent">
                        {ex.exercise_type}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-muted-foreground">
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
