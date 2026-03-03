"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buildPocketBaseUrl } from "./useRoutineProgress";
import { type RoutineMode } from "./useCreateRoutineModal";

export type EditDayExercise = {
  exercise_id: string;
  sets: string;
  reps: string;
  rest_seconds: string;
  notes: string;
};

export type EditDayPlan = {
  label: string;
  exercises: EditDayExercise[];
};

export type EditRoutineInitialData = {
  id: string;
  name: string;
  level: string;
  mode?: RoutineMode;
  days: EditDayPlan[];
};

const MAX_WEEKLY_DAYS = 7;
const MAX_FREE_DAYS = 31;

function blankExercise(): EditDayExercise {
  return {
    exercise_id: "",
    sets: "",
    reps: "",
    rest_seconds: "",
    notes: "",
  };
}

function presetExercise(exerciseId: string): EditDayExercise {
  return {
    exercise_id: exerciseId,
    sets: "3",
    reps: "8-10",
    rest_seconds: "90",
    notes: "",
  };
}

function cloneDays(days: EditDayPlan[]): EditDayPlan[] {
  if (!days.length) {
    return [{ label: "Day 1", exercises: [blankExercise()] }];
  }

  return days.map((day, dayIndex) => ({
    label: day.label?.trim() || `Day ${dayIndex + 1}`,
    exercises:
      day.exercises.length > 0
        ? day.exercises.map((exercise) => ({
            exercise_id: exercise.exercise_id ?? "",
            sets: exercise.sets ?? "",
            reps: exercise.reps ?? "",
            rest_seconds: exercise.rest_seconds ?? "",
            notes: exercise.notes ?? "",
          }))
        : [blankExercise()],
  }));
}

type UseEditRoutineModalParams = {
  routine: EditRoutineInitialData;
  t: (key: string, values?: Record<string, string | number>) => string;
};

type PocketBaseErrorBody = {
  message?: string;
  status?: number;
  data?: Record<string, { code?: string; message?: string }>;
};

function parsePocketBaseErrorMessage(
  text: string,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  try {
    const parsed = JSON.parse(text) as PocketBaseErrorBody;
    if (!parsed || typeof parsed !== "object") return t("edit.errors.generic");

    const fieldEntries = Object.entries(parsed.data ?? {});
    if (fieldEntries.length > 0) {
      const [firstField, firstIssue] = fieldEntries[0];
      if (firstField === "sets") return t("create.errors.setsRequired");
      if (firstField === "reps") return t("create.errors.repsRequired");
      if (firstField === "exercise_id") return t("create.errors.exerciseRequired");
      if (firstField === "rest_seconds") return t("create.errors.restInvalid");
      if (firstIssue?.message) return firstIssue.message;
    }

    if (parsed.message) return parsed.message;
  } catch {
    return text || t("edit.errors.generic");
  }

  return t("edit.errors.generic");
}

export function useEditRoutineModal({ routine, t }: UseEditRoutineModalParams) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(routine.name);
  const [level, setLevel] = useState(routine.level);
  const [mode, setMode] = useState<RoutineMode>(routine.mode ?? "weekly");
  const [days, setDays] = useState<EditDayPlan[]>(cloneDays(routine.days));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<
    "name" | "exercise" | "sets" | "reps" | "rest" | null
  >(null);

  const maxDays = mode === "weekly" ? MAX_WEEKLY_DAYS : MAX_FREE_DAYS;
  const canAddDay = days.length < maxDays;
  const totalExercises = useMemo(
    () => days.reduce((acc, day) => acc + day.exercises.length, 0),
    [days],
  );

  const resetFromRoutine = () => {
    setName(routine.name);
    setLevel(routine.level);
    setMode(routine.mode ?? "weekly");
    setDays(cloneDays(routine.days));
    setError(null);
    setErrorField(null);
  };

  const openModal = () => {
    if (isSubmitting) return;
    resetFromRoutine();
    setIsOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    resetFromRoutine();
  };

  const updateDayLabel = (dayIndex: number, label: string) => {
    setDays((prev) =>
      prev.map((day, idx) => (idx === dayIndex ? { ...day, label } : day)),
    );
  };

  const updateExercise = (
    dayIndex: number,
    exerciseIndex: number,
    patch: Partial<EditDayExercise>,
  ) => {
    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;
        return {
          ...day,
          exercises: day.exercises.map((exercise, exIdx) =>
            exIdx === exerciseIndex ? { ...exercise, ...patch } : exercise,
          ),
        };
      }),
    );
  };

  const addDay = () => {
    if (!canAddDay) return;
    setDays((prev) => [
      ...prev,
      { label: `Day ${prev.length + 1}`, exercises: [blankExercise()] },
    ]);
  };

  const removeDay = (dayIndex: number) => {
    setDays((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, idx) => idx !== dayIndex);
    });
  };

  const addExercise = (dayIndex: number) => {
    setDays((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex
          ? { ...day, exercises: [...day.exercises, blankExercise()] }
          : day,
      ),
    );
  };

  const toggleExerciseInDay = (dayIndex: number, exerciseId: string, checked: boolean) => {
    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;

        const hasExercise = day.exercises.some((exercise) => exercise.exercise_id === exerciseId);
        if (checked) {
          if (hasExercise) return day;
          const hasSingleBlank =
            day.exercises.length === 1 &&
            !day.exercises[0].exercise_id &&
            !day.exercises[0].sets &&
            !day.exercises[0].reps &&
            !day.exercises[0].rest_seconds &&
            !day.exercises[0].notes;
          return {
            ...day,
            exercises: hasSingleBlank
              ? [presetExercise(exerciseId)]
              : [...day.exercises, presetExercise(exerciseId)],
          };
        }

        return {
          ...day,
          exercises: day.exercises.filter((exercise) => exercise.exercise_id !== exerciseId),
        };
      }),
    );
  };

  const removeExercise = (dayIndex: number, exerciseIndex: number) => {
    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;
        if (day.exercises.length === 1) return day;
        return {
          ...day,
          exercises: day.exercises.filter((_, exIdx) => exIdx !== exerciseIndex),
        };
      }),
    );
  };

  const moveExercise = (dayIndex: number, fromIndex: number, toIndex: number) => {
    setDays((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;
        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= day.exercises.length ||
          toIndex >= day.exercises.length ||
          fromIndex === toIndex
        ) {
          return day;
        }

        const reordered = [...day.exercises];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);

        return { ...day, exercises: reordered };
      }),
    );
  };

  const submit = async () => {
    setError(null);
    setErrorField(null);

    if (!name.trim()) {
      setErrorField("name");
      setError(t("create.errors.nameRequired"));
      return;
    }
    if (mode === "weekly" && days.length > MAX_WEEKLY_DAYS) {
      setError(t("create.maxDaysHint", { count: MAX_WEEKLY_DAYS }));
      return;
    }

    const selectedRows = days.flatMap((day, dayIndex) =>
      day.exercises.map((exercise, exerciseIndex) => ({
        dayLabel: day.label,
        dayIndex,
        exerciseIndex,
        ...exercise,
      })),
    );

    if (selectedRows.length === 0) {
      setError(t("create.errors.minExercises"));
      return;
    }

    const invalidExercise = selectedRows.find((row) => !row.exercise_id);
    if (invalidExercise) {
      setErrorField("exercise");
      setError(
        t("create.errors.exerciseRowRequired", {
          day: invalidExercise.dayIndex + 1,
          exercise: invalidExercise.exerciseIndex + 1,
        }),
      );
      return;
    }

    const invalidSets = selectedRows.find((row) => {
      const value = row.sets.trim();
      if (!value) return true;
      const num = Number(value);
      return Number.isNaN(num) || num <= 0 || !Number.isInteger(num);
    });

    if (invalidSets) {
      setErrorField("sets");
      setError(
        t("create.errors.setsRowRequired", {
          day: invalidSets.dayIndex + 1,
          exercise: invalidSets.exerciseIndex + 1,
        }),
      );
      return;
    }

    const invalidReps = selectedRows.find((row) => !row.reps.trim());
    if (invalidReps) {
      setErrorField("reps");
      setError(
        t("create.errors.repsRowRequired", {
          day: invalidReps.dayIndex + 1,
          exercise: invalidReps.exerciseIndex + 1,
        }),
      );
      return;
    }

    const invalidRest = selectedRows.find((row) => {
      const value = row.rest_seconds.trim();
      if (!value) return false;
      const num = Number(value);
      return Number.isNaN(num) || num < 0;
    });

    if (invalidRest) {
      setErrorField("rest");
      setError(
        t("create.errors.restRowInvalid", {
          day: invalidRest.dayIndex + 1,
          exercise: invalidRest.exerciseIndex + 1,
        }),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const routineRes = await fetch(buildPocketBaseUrl(`/collections/routines/records/${routine.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          level,
          mode,
          split: name.trim(),
          days_per_week: days.length,
        }),
      });

      if (!routineRes.ok) {
        const detail = await routineRes.text().catch(() => "");
        throw new Error(parsePocketBaseErrorMessage(detail, t));
      }

      const linkedRes = await fetch(
        buildPocketBaseUrl(
          `/collections/routine_exercises/records?filter=${encodeURIComponent(
            `routine_id=\"${routine.id}\"`,
          )}&perPage=500`,
        ),
        { cache: "no-store" },
      );

      if (!linkedRes.ok) {
        throw new Error(t("edit.errors.generic"));
      }

      const linkedData = (await linkedRes.json()) as { items: Array<{ id: string }> };

      if (linkedData.items.length > 0) {
        const cleanupResults = await Promise.all(
          linkedData.items.map((item) =>
            fetch(buildPocketBaseUrl(`/collections/routine_exercises/records/${item.id}`), {
              method: "DELETE",
            }),
          ),
        );

        if (cleanupResults.some((res) => !res.ok && res.status !== 404)) {
          throw new Error(t("edit.errors.generic"));
        }
      }

      const requests = days.flatMap((day, dayIndex) =>
        day.exercises.map((exercise, exerciseIndex) =>
          fetch(buildPocketBaseUrl("/collections/routine_exercises/records"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              routine_id: routine.id,
              exercise_id: exercise.exercise_id,
              sets: Number(exercise.sets.trim()),
              reps: exercise.reps.trim(),
              rest_seconds: exercise.rest_seconds.trim()
                ? Number(exercise.rest_seconds)
                : undefined,
              notes: exercise.notes.trim() || undefined,
              day_index: dayIndex + 1,
              day_label: day.label.trim() || `${t("create.dayFallback")} ${dayIndex + 1}`,
              order_index: exerciseIndex + 1,
            }),
          }),
        ),
      );

      const results = await Promise.all(requests);
      const failed = results.find((res) => !res.ok);
      if (failed) {
        const detail = await failed.text().catch(() => "");
        throw new Error(parsePocketBaseErrorMessage(detail, t));
      }

      setIsOpen(false);
      toast.success(t("edit.success.updated"));
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("edit.errors.generic");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isOpen,
    openModal,
    closeModal,
    name,
    setName,
    level,
    setLevel,
    mode,
    setMode,
    days,
    isSubmitting,
    error,
    errorField,
    canAddDay,
    maxDays,
    totalExercises,
    updateDayLabel,
    updateExercise,
    addDay,
    removeDay,
    addExercise,
    toggleExerciseInDay,
    removeExercise,
    moveExercise,
    submit,
  };
}
