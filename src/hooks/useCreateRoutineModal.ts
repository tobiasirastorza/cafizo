"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type UseCreateRoutineModalParams = {
  t: (key: string, values?: Record<string, string | number>) => string;
};

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

  const resetForm = () => {
    setName("");
    setLevel("beginner");
    setDays([{ label: "Day 1", exercises: [blankExercise()] }]);
    setError(null);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    resetForm();
  };

  const submit = async () => {
    setError(null);

    if (!DEFAULT_TRAINER_ID) {
      setError(t("create.errors.noTrainer"));
      return;
    }
    if (!name.trim()) {
      setError(t("create.errors.nameRequired"));
      return;
    }

    const selectedRows = days.flatMap((day) =>
      day.exercises.map((exercise) => ({
        dayLabel: day.label.trim() || t("create.dayFallback"),
        ...exercise,
      })),
    );

    if (selectedRows.length === 0) {
      setError(t("create.errors.minExercises"));
      return;
    }
    if (selectedRows.some((row) => !row.exercise_id)) {
      setError(t("create.errors.exerciseRequired"));
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
        throw new Error(detail || "Failed to create routine");
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
              sets: exercise.sets.trim() || undefined,
              reps: exercise.reps.trim() || undefined,
              rest_seconds: exercise.rest_seconds.trim()
                ? Number(exercise.rest_seconds)
                : undefined,
              notes: exercise.notes.trim() || undefined,
              day_index: dayIndex + 1,
              day_label: day.label.trim() || `Day ${dayIndex + 1}`,
              order_index: exerciseIndex + 1,
            }),
          }),
        ),
      );

      const results = await Promise.all(requests);
      const failed = results.find((res) => !res.ok);
      if (failed) {
        const detail = await failed.text().catch(() => "");
        throw new Error(detail || "Failed to add routine exercises");
      }

      closeModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("create.errors.generic"));
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
    canAddDay,
    totalExercises,
    updateDayLabel,
    updateExercise,
    addDay,
    removeDay,
    addExercise,
    removeExercise,
    closeModal,
    submit,
  };
}
