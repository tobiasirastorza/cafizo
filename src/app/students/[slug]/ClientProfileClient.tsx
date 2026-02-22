"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import AssignRoutineModal from "./AssignRoutineModal";

type Routine = {
  id: string;
  name: string;
  level?: string;
  split?: string;
  days_per_week?: number;
};

type Student = {
  id: string;
  name: string;
  status?: string;
  phone?: string;
  created?: string;
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

type StudentRoutine = {
  id: string;
  status: string;
  progress_current: number;
  progress_total: number;
  started_at?: string;
  completed_at?: string;
  expand?: {
    routine_id?: Routine;
  };
};

interface ClientProfileClientProps {
  student: Student;
  activeRoutine: Routine | null;
  availableRoutines: Routine[];
  exerciseCompletions: ExerciseCompletion[];
  routineHistory: StudentRoutine[];
  slug: string;
}

function formatTime(dateStr: string | undefined) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClientProfileClient({
  student,
  activeRoutine,
  availableRoutines,
  exerciseCompletions,
  slug,
}: ClientProfileClientProps) {
  const t = useTranslations("ClientProfile");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sortedCompletions = [...exerciseCompletions].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  );

  const groupedByDate = sortedCompletions.reduce((acc, completion) => {
    const date = new Date(completion.completed_at).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(completion);
    return acc;
  }, {} as Record<string, ExerciseCompletion[]>);
  const activeRoutineMeta = (() => {
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
  })();

  return (
    <>
      {/* Header */}
      <section className="border-b border-border pb-6">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors duration-150 hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          {t("back")}
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold uppercase leading-tight tracking-tight text-foreground md:text-3xl">
            {student.name}
          </h1>
        </div>
      </section>

      {/* Active Program */}
      <section className="border border-border bg-background-card p-5 rounded-lg md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-accent">
              {activeRoutine ? t("activeProgram") : t("noActiveProgram")}
            </div>
            <h2 className="mt-2 text-xl font-semibold text-foreground md:text-2xl">
              {activeRoutine?.name ?? t("noRoutineAssigned")}
            </h2>
            {activeRoutine && (
              <div className="mt-1 text-xs uppercase tracking-[0.08em] text-foreground-muted">
                {activeRoutineMeta}
              </div>
            )}
          </div>

          {activeRoutine ? (
            <Link
              href={`/students/${slug}/workouts`}
              className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
            >
              {t("viewWorkouts")}
            </Link>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-10 items-center justify-center border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90"
            >
              {t("actions.assign")}
            </button>
          )}
        </div>
      </section>

      {/* Activity Timeline */}
      <section className="min-h-[300px]">
        <div className="space-y-4">
            {sortedCompletions.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-base font-semibold text-foreground">No activity yet</div>
                <div className="mt-2 text-sm text-foreground-secondary">
                  {activeRoutine
                    ? "This client hasn't logged any exercises yet."
                    : "Assign a routine to start tracking activity."}
                </div>
              </div>
            ) : (
              Object.entries(groupedByDate).map(([date, completions]) => (
                <div key={date} className="border-l-2 border-accent pl-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="-ml-[21px] h-3 w-3 rounded-full bg-accent" />
                    <div className="text-sm font-medium uppercase tracking-[0.08em] text-accent">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-foreground-secondary">
                      {completions.length} exercises
                    </div>
                  </div>

                  <div className="space-y-2">
                    {completions.map((completion) => {
                      const exercise = completion.expand?.routine_exercise_id?.expand?.exercise_id;
                      return (
                        <div
                          key={completion.id}
                          className="border border-border bg-background-card p-3 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${
                              completion.status === "completed" ? "bg-accent" : "bg-yellow-500"
                            }`} />
                            <span className="font-medium text-foreground">
                              {exercise?.name ?? "Unknown"}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-secondary">
                            {exercise?.muscle_group && (
                              <span className="uppercase">{exercise.muscle_group}</span>
                            )}
                            {completion.sets && <span><strong className="text-foreground">{completion.sets}</strong> sets</span>}
                            {completion.reps && <span><strong className="text-foreground">{completion.reps}</strong> reps</span>}
                            {completion.weight && <span><strong className="text-foreground">{completion.weight}</strong> kg</span>}
                            <span>{formatTime(completion.completed_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
        </div>
      </section>

      <AssignRoutineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        studentId={slug}
        routines={availableRoutines}
      />
    </>
  );
}
