"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { recalculateRoutineProgress, buildPocketBaseUrl } from "./useRoutineProgress";

export type WorkoutEntry = {
  routineExerciseId: string;
  dayIndex: number;
  dayLabel: string;
  orderIndex: number;
  lastCompletionId?: string;
  exerciseName: string;
  muscleGroup: string;
  targetSets?: string;
  targetReps?: string;
  lastStatus: "completed" | "skipped" | null;
  lastSets?: number;
  lastReps?: string;
  lastWeight?: number;
  lastCompletedAt?: string;
};

type UseWorkoutsTrackerParams = {
  studentId: string;
  currentWeekKey: string;
  entries: WorkoutEntry[];
  t: (key: string, values?: Record<string, string | number>) => string;
  toast: { success: (m: string) => void; error: (m: string) => void };
};

function toLocalDatetimeInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeIntegerString(value: string | number | undefined) {
  if (value === undefined || value === null) return "";
  const match = String(value).match(/\d+/);
  return match ? String(Number(match[0])) : "";
}

export function useWorkoutsTracker({
  studentId,
  currentWeekKey,
  entries,
  t,
  toast,
}: UseWorkoutsTrackerParams) {
  const router = useRouter();
  const [selected, setSelected] = useState<WorkoutEntry | null>(null);
  const [status, setStatus] = useState<"completed" | "skipped">("completed");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [completedAt, setCompletedAt] = useState(toLocalDatetimeInputValue(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const grouped = entries.reduce((acc, entry) => {
      const key = `${entry.dayIndex}-${entry.dayLabel}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    }, {} as Record<string, WorkoutEntry[]>);

    return Object.entries(grouped)
      .map(([key, items]) => ({
        key,
        dayIndex: items[0].dayIndex,
        dayLabel: items[0].dayLabel,
        items: [...items].sort((a, b) => a.orderIndex - b.orderIndex),
      }))
      .sort((a, b) => a.dayIndex - b.dayIndex);
  }, [entries]);

  const completedCount = entries.filter((entry) => entry.lastStatus === "completed").length;
  const skippedCount = entries.filter((entry) => entry.lastStatus === "skipped").length;
  const totalCount = entries.length;
  const isWeekCompleted = totalCount > 0 && completedCount === totalCount;

  const openLogModal = (entry: WorkoutEntry) => {
    setSelected(entry);
    setStatus(entry.lastStatus ?? "completed");
    setSets(normalizeIntegerString(entry.lastSets ?? entry.targetSets));
    setReps(normalizeIntegerString(entry.lastReps ?? entry.targetReps));
    setWeight(entry.lastWeight ? String(entry.lastWeight) : "");
    setCompletedAt(toLocalDatetimeInputValue(new Date()));
    setError(null);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setSelected(null);
    setError(null);
  };

  const submit = async () => {
    if (!selected) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const completedDate = new Date(completedAt);
      if (Number.isNaN(completedDate.getTime())) {
        throw new Error(t("errors.invalidCompletionDate"));
      }
      const setsValue = normalizeIntegerString(sets);
      const repsValue = normalizeIntegerString(reps);
      const weightValue = String(weight ?? "").trim();

      const isUpdate = Boolean(selected.lastCompletionId);
      const endpoint = isUpdate
        ? buildPocketBaseUrl(`/collections/exercise_completions/records/${selected.lastCompletionId}`)
        : buildPocketBaseUrl("/collections/exercise_completions/records");

      const res = await fetch(endpoint, {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          routine_exercise_id: selected.routineExerciseId,
          completed_at: completedDate.toISOString(),
          week_key: currentWeekKey,
          status,
          sets: setsValue ? Number(setsValue) : undefined,
          reps: repsValue || undefined,
          weight: weightValue ? Number(weightValue) : undefined,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || t("errors.saveFailed"));
      }

      await recalculateRoutineProgress(studentId, currentWeekKey);
      toast.success(t("actions.saveSuccess"));
      closeModal();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.saveFailed");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeLog = async () => {
    if (!selected?.lastCompletionId) return;
    const confirmed = window.confirm(t("actions.deleteConfirm"));
    if (!confirmed) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(
        buildPocketBaseUrl(`/collections/exercise_completions/records/${selected.lastCompletionId}`),
        { method: "DELETE" },
      );

      if (!res.ok && res.status !== 404) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || t("errors.deleteFailed"));
      }

      await recalculateRoutineProgress(studentId, currentWeekKey);
      toast.success(t("actions.deleteSuccess"));
      closeModal();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.deleteFailed");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    byDay,
    completedCount,
    skippedCount,
    totalCount,
    isWeekCompleted,
    selected,
    status,
    sets,
    reps,
    weight,
    completedAt,
    isSubmitting,
    error,
    setStatus,
    setSets,
    setReps,
    setWeight,
    setCompletedAt,
    openLogModal,
    closeModal,
    submit,
    removeLog,
  };
}
