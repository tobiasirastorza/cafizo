"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import AppShell from "../components/AppShell";
import { RoutineCard } from "./RoutineCard";
import RoutinesHeader from "./RoutinesHeader";

type ExerciseOption = {
  id: string;
  name: string;
  muscle_group?: string;
};

type ExerciseEntry = {
  id: string;
  exercise_id: string;
  name: string;
  muscle_group: string;
  exercise_type: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
  notes?: string;
};

type RoutineData = {
  id: string;
  name: string;
  level: string;
  split: string;
  days_per_week: number;
  mode: "weekly" | "free";
  exercisesByDay: Record<number, ExerciseEntry[]>;
  dayLabels: Record<number, string>;
};

type RoutinesPageClientProps = {
  routineData: RoutineData[];
  exercises: ExerciseOption[];
};

export default function RoutinesPageClient({
  routineData,
  exercises,
}: RoutinesPageClientProps) {
  const t = useTranslations("Routines");
  const [query, setQuery] = useState("");

  const filteredRoutines = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return routineData;
    return routineData.filter((routine) =>
      routine.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query, routineData]);

  return (
    <AppShell>
      <RoutinesHeader exercises={exercises} />

      <section className="mt-6">
        <div className="max-w-md">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search.placeholder")}
            className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
          />
        </div>
      </section>

      <section className="mt-8 flex flex-col">
        {filteredRoutines.length === 0 ? (
          <div className="border border-dashed border-border bg-background-card p-8 rounded-lg text-sm text-foreground-secondary">
            {t("search.empty")}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredRoutines.map((routine) => (
              <RoutineCard key={routine.id} routine={routine} exercises={exercises} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
