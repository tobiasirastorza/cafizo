"use client";

import { useTranslations } from "next-intl";
import { useToast } from "../components/ToastProvider";
import { useRoutineCardActions } from "@/hooks/useRoutineCardActions";
import EditRoutineModal from "./EditRoutineModal";
import { type ExerciseOption } from "@/hooks/useCreateRoutineModal";

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
  exercisesByDay: Record<number, ExerciseEntry[]>;
  dayLabels: Record<number, string>;
};

type RoutineCardProps = {
  routine: RoutineData;
  exercises: ExerciseOption[];
};

export function RoutineCard({ routine, exercises }: RoutineCardProps) {
  const t = useTranslations("Routines");
  const toast = useToast();
  const { expanded, isDeleting, toggleExpanded, removeRoutine } = useRoutineCardActions({
    routineId: routine.id,
    t,
    toast,
  });
  const showSplit =
    Boolean(routine.split?.trim()) &&
    routine.split.trim().toLowerCase() !== routine.name.trim().toLowerCase();

  const days = Object.keys(routine.exercisesByDay)
    .map(Number)
    .sort((a, b) => a - b);
  const editableDays = days.map((day) => ({
    label: routine.dayLabels[day] || `Day ${day}`,
    exercises: routine.exercisesByDay[day].map((ex) => ({
      exercise_id: ex.exercise_id,
      sets: String(ex.sets ?? ""),
      reps: ex.reps ?? "",
      rest_seconds:
        ex.rest_seconds === null || ex.rest_seconds === undefined
          ? ""
          : String(ex.rest_seconds),
      notes: ex.notes ?? "",
    })),
  }));

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
          <EditRoutineModal
            routine={{
              id: routine.id,
              name: routine.name,
              level: routine.level,
              days: editableDays,
            }}
            exercises={exercises}
          />
          <button
            onClick={toggleExpanded}
            className="h-10 border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
          >
            {expanded ? t("actions.collapse") : t("actions.expand")}
          </button>
          <button
            type="button"
            onClick={removeRoutine}
            disabled={isDeleting}
            className="inline-flex h-10 items-center justify-center border border-red-500 bg-red-500 px-4 text-sm font-medium text-white rounded-md transition-colors duration-150 hover:bg-red-600 disabled:opacity-60"
          >
            {isDeleting ? t("actions.deleting") : (t("actions.delete") || "Delete routine")}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-6 space-y-4">
          {days.map((day) => (
            <div key={day} className="border border-border rounded-lg overflow-hidden">
              <div className="border-b border-border bg-background-muted px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] text-foreground-label">
                {routine.dayLabels[day] || `Day ${day}`}
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
