"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buildPocketBaseUrl } from "./useRoutineProgress";

export type ExerciseOption = {
  id: string;
  name: string;
  muscle_group?: string;
};

export type DayExercise = {
  exercise_id: string;
  sets: string;
  reps: string;
  rest_seconds: string;
  notes: string;
};

export type DayPlan = {
  label: string;
  exercises: DayExercise[];
};

const DEFAULT_TRAINER_ID = process.env.NEXT_PUBLIC_DEFAULT_TRAINER_ID ?? "";

function blankExercise(): DayExercise {
  return {
    exercise_id: "",
    sets: "",
    reps: "",
    rest_seconds: "",
    notes: "",
  };
}

function presetExercise(exerciseId: string): DayExercise {
  return {
    exercise_id: exerciseId,
    sets: "3",
    reps: "8-10",
    rest_seconds: "90",
    notes: "",
  };
}

type UseCreateRoutineModalParams = {
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
    if (!parsed || typeof parsed !== "object") return t("create.errors.generic");

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
    return text || t("create.errors.generic");
  }

  return t("create.errors.generic");
}

export function useCreateRoutineModal({ t }: UseCreateRoutineModalParams) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("beginner");
  const [days, setDays] = useState<DayPlan[]>([
    { label: "Day 1", exercises: [blankExercise()] },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<
    "name" | "exercise" | "sets" | "reps" | "rest" | null
  >(null);

  const canAddDay = days.length < 7;
  const totalExercises = useMemo(
    () => days.reduce((acc, day) => acc + day.exercises.length, 0),
    [days],
  );

  const updateDayLabel = (dayIndex: number, label: string) => {
    setDays((prev) =>
      prev.map((day, idx) => (idx === dayIndex ? { ...day, label } : day)),
    );
  };

  const updateExercise = (
    dayIndex: number,
    exerciseIndex: number,
    patch: Partial<DayExercise>,
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

  const resetForm = () => {
    setName("");
    setLevel("beginner");
    setDays([{ label: "Day 1", exercises: [blankExercise()] }]);
    setError(null);
    setErrorField(null);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    resetForm();
  };

  const submit = async () => {
    setError(null);
    setErrorField(null);

    if (!DEFAULT_TRAINER_ID) {
      setError(t("create.errors.noTrainer"));
      return;
    }
    if (!name.trim()) {
      setErrorField("name");
      setError(t("create.errors.nameRequired"));
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
      const routineRes = await fetch(buildPocketBaseUrl("/collections/routines/records"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          level,
          split: name.trim(),
          days_per_week: days.length,
          trainer_id: DEFAULT_TRAINER_ID,
        }),
      });

      if (!routineRes.ok) {
        const detail = await routineRes.text().catch(() => "");
        throw new Error(parsePocketBaseErrorMessage(detail, t));
      }

      const routine = (await routineRes.json()) as { id: string };

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

      closeModal();
      toast.success(t("create.success.created"));
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("create.errors.generic");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isOpen,
    setIsOpen,
    name,
    setName,
    level,
    setLevel,
    days,
    isSubmitting,
    error,
    errorField,
    canAddDay,
    totalExercises,
    updateDayLabel,
    updateExercise,
    addDay,
    removeDay,
    addExercise,
    toggleExerciseInDay,
    removeExercise,
    moveExercise,
    closeModal,
    submit,
  };
}
