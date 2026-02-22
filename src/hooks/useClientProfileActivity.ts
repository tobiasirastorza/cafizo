"use client";

import { useMemo, useState } from "react";

type Routine = {
  id: string;
  name: string;
  level?: string;
  split?: string;
  days_per_week?: number;
};

type ExerciseCompletion = {
  id: string;
  completed_at: string;
  status: string;
  sets?: number;
  reps?: string;
  weight?: number;
  expand?: {
    routine_exercise_id?: {
      expand?: {
        exercise_id?: {
          name: string;
          muscle_group?: string;
        };
      };
    };
  };
};

export function useClientProfileActivity(
  activeRoutine: Routine | null,
  exerciseCompletions: ExerciseCompletion[],
) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedCompletions = useMemo(
    () =>
      [...exerciseCompletions].sort(
        (a, b) =>
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
      ),
    [exerciseCompletions],
  );

  const groupedByDate = useMemo(
    () =>
      sortedCompletions.reduce((acc, completion) => {
        const completedAt = new Date(completion.completed_at);
        const year = completedAt.getFullYear();
        const month = String(completedAt.getMonth() + 1).padStart(2, "0");
        const day = String(completedAt.getDate()).padStart(2, "0");
        const date = `${year}-${month}-${day}`;
        if (!acc[date]) acc[date] = [];
        acc[date].push(completion);
        return acc;
      }, {} as Record<string, ExerciseCompletion[]>),
    [sortedCompletions],
  );

  const activeRoutineMeta = useMemo(() => {
    if (!activeRoutine) return "";
    const parts: string[] = [];
    if (activeRoutine.level?.trim()) parts.push(activeRoutine.level.toUpperCase());
    if (
      activeRoutine.split?.trim() &&
      activeRoutine.split.trim().toLowerCase() !== activeRoutine.name.trim().toLowerCase()
    ) {
      parts.push(activeRoutine.split.toUpperCase());
    }
    if (typeof activeRoutine.days_per_week === "number") {
      parts.push(`${activeRoutine.days_per_week} days/week`);
    }
    return parts.join(" • ");
  }, [activeRoutine]);

  return {
    isModalOpen,
    setIsModalOpen,
    sortedCompletions,
    groupedByDate,
    activeRoutineMeta,
  };
}
