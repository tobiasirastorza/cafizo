"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  RiEditLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiCloseLine,
} from "@remixicon/react";
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
  days_per_week?: number;
  mode: "weekly" | "free";
  exercisesByDay: Record<number, ExerciseEntry[]>;
  dayLabels: Record<number, string>;
};

type RoutineCardProps = {
  routine: RoutineData;
  exercises: ExerciseOption[];
  index: number;
};

type RoutineActionButtonProps = {
  label: string;
  icon: ReactNode;
  tone?: "neutral" | "danger";
  disabled?: boolean;
  onClick?: () => void;
};

function RoutineActionButton({
  label,
  icon,
  tone = "neutral",
  disabled = false,
  onClick,
}: RoutineActionButtonProps) {
  const toneClasses =
    tone === "danger"
      ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
      : "border-border bg-background-card text-foreground hover:bg-background-muted";

  return (
    <div className="group relative">
      <span className="pointer-events-none absolute -top-11 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background shadow-sm group-hover:block group-focus-within:block">
        {label}
        <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-foreground" />
      </span>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-md border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60 ${toneClasses}`}
      >
        {icon}
      </button>
    </div>
  );
}

export function RoutineCard({ routine, exercises, index }: RoutineCardProps) {
  const DAY_SELECTOR_DROPDOWN_THRESHOLD = 5;
  const t = useTranslations("Routines");
  const toast = useToast();
  const { isDeleting, removeRoutine } = useRoutineCardActions({
    routineId: routine.id,
    t,
    toast,
  });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const showSplit =
    Boolean(routine.split?.trim()) &&
    routine.split.trim().toLowerCase() !== routine.name.trim().toLowerCase();

  const days = Object.keys(routine.exercisesByDay)
    .map(Number)
    .sort((a, b) => a - b);
  const [selectedDay, setSelectedDay] = useState<number>(days[0] ?? 1);
  const programmedDays = days.length;
  const useDayDropdown = days.length > DAY_SELECTOR_DROPDOWN_THRESHOLD;
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
    <>
    <div className={`border border-border rounded-lg p-6 ${index % 2 === 0 ? "bg-background-card" : "bg-background-muted/20"}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
            <span className="bg-background-muted px-2 py-1 text-foreground rounded">
              {routine.level}
            </span>
            <span className="bg-background-muted px-2 py-1 text-foreground rounded">
              {routine.mode === "free" ? t("create.modes.free") : t("create.modes.weekly")}
            </span>
            {showSplit ? <span>{routine.split}</span> : null}
          </div>
          <div className="mt-3 text-xl font-semibold leading-tight text-foreground md:text-2xl">
            {routine.name}
          </div>
          <div className="mt-2 text-xs uppercase tracking-[0.08em] text-foreground-muted">
            {routine.mode === "free"
              ? t("daysProgrammed", { count: programmedDays })
              : t("daysPerWeek", { count: routine.days_per_week ?? programmedDays })}
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
          <div className="group relative">
            <span className="pointer-events-none absolute -top-11 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background shadow-sm group-hover:block group-focus-within:block">
              {t("actions.edit")}
              <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-foreground" />
            </span>
            <EditRoutineModal
              routine={{
                id: routine.id,
                name: routine.name,
                level: routine.level,
                mode: routine.mode,
                days: editableDays,
              }}
              exercises={exercises}
              triggerAriaLabel={t("actions.edit")}
              triggerClassName="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background-card text-foreground transition-colors duration-150 hover:bg-background-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
              triggerContent={<RiEditLine size={18} aria-hidden="true" />}
            />
          </div>
          <RoutineActionButton
            label={t("actions.expand")}
            icon={<RiEyeLine size={18} aria-hidden="true" />}
            onClick={() => {
              setSelectedDay(days[0] ?? 1);
              setIsDetailsOpen(true);
            }}
          />
          <RoutineActionButton
            label={isDeleting ? t("actions.deleting") : (t("actions.delete") || "Delete routine")}
            icon={<RiDeleteBinLine size={18} aria-hidden="true" />}
            onClick={removeRoutine}
            disabled={isDeleting}
            tone="danger"
          />
        </div>
      </div>
    </div>
      {isDetailsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-border bg-background-card"
            style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
          >
            <div className="sticky top-0 z-20 border-b border-border-subtle bg-background-card/95 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                    <span className="rounded bg-background-muted px-2 py-1 text-foreground">
                      {routine.level}
                    </span>
                    <span className="rounded bg-background-muted px-2 py-1 text-foreground">
                      {routine.mode === "free" ? t("create.modes.free") : t("create.modes.weekly")}
                    </span>
                    {showSplit ? <span>{routine.split}</span> : null}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-foreground">{routine.name}</h2>
                  <p className="mt-2 text-sm text-foreground-secondary">
                    {routine.mode === "free"
                      ? t("daysProgrammed", { count: programmedDays })
                      : t("daysPerWeek", { count: routine.days_per_week ?? programmedDays })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  aria-label={t("actions.collapse")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background-card text-foreground transition-colors duration-150 hover:bg-background-muted"
                >
                  <RiCloseLine size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {days.length > 0 ? (
                <>
                  {useDayDropdown ? (
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                        {t("create.labels.day")}
                      </span>
                      <select
                        value={String(selectedDay)}
                        onChange={(e) => setSelectedDay(Number(e.target.value))}
                        className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                        aria-label={t("create.placeholders.selectDay")}
                      >
                        {days.map((day) => (
                          <option key={`routine-day-${day}`} value={day}>
                            {routine.dayLabels[day] || `Day ${day}`}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {days.map((day) => {
                        const isActive = day === selectedDay;
                        return (
                          <button
                            key={`routine-day-tab-${day}`}
                            type="button"
                            onClick={() => setSelectedDay(day)}
                            className={`inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors duration-150 ${
                              isActive
                                ? "border-accent bg-accent text-accent-foreground"
                                : "border-border bg-background-card text-foreground hover:bg-background-muted"
                            }`}
                          >
                            {routine.dayLabels[day] || `Day ${day}`}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="border-b border-border bg-background-muted px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] text-foreground-label">
                      {routine.dayLabels[selectedDay] || `Day ${selectedDay}`}
                    </div>
                    <div>
                      {(routine.exercisesByDay[selectedDay] ?? []).map((ex, idx) => (
                        <div
                          key={ex.id}
                          className={`flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm last:border-b-0 ${idx % 2 === 0 ? "bg-background-card" : "bg-background-muted/30"}`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="truncate font-medium text-foreground">
                              {ex.name}
                            </span>
                            <span className="text-xs uppercase tracking-[0.08em] text-foreground-muted">
                              {ex.muscle_group}
                            </span>
                            <span className="text-xs font-medium text-accent">
                              {ex.exercise_type}
                            </span>
                          </div>
                          <div className="shrink-0 text-sm text-foreground-secondary">
                            {ex.sets} × {ex.reps}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
