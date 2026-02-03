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

  return (
    <>
      {/* Header */}
      <section className="border-b border-border pb-6">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          {t("back")}
        </Link>

        <div className="mt-6">
          <h1 className="text-[clamp(3rem,10vw,8rem)] font-bold uppercase leading-[0.85] tracking-tighter text-foreground">
            {student.name}
          </h1>
        </div>
      </section>

      {/* Active Program */}
      <section className="border border-border bg-background p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-accent">
              {activeRoutine ? t("activeProgram") : t("noActiveProgram")}
            </div>
            <h2 className="mt-2 text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl">
              {activeRoutine?.name ?? t("noRoutineAssigned")}
            </h2>
            {activeRoutine && (
              <div className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {activeRoutine.level?.toUpperCase()} • {activeRoutine.split?.toUpperCase()} • {activeRoutine.days_per_week} days/week
              </div>
            )}
          </div>

          {activeRoutine ? (
            <Link
              href={`/students/${slug}/workouts`}
              className="inline-flex h-10 items-center justify-center border-2 border-border px-4 text-sm font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              {t("viewWorkouts")}
            </Link>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-10 items-center justify-center border-2 border-accent bg-accent px-4 text-sm font-bold uppercase tracking-widest text-accent-foreground transition-colors hover:scale-[1.02]"
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
                <div className="text-lg font-bold uppercase text-foreground">No activity yet</div>
                <div className="mt-2 text-sm text-muted-foreground">
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
                    <div className="text-sm font-bold uppercase tracking-wider text-accent">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {completions.length} exercises
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {completions.map((completion) => {
                      const exercise = completion.expand?.routine_exercise_id?.expand?.exercise_id;
                      return (
                        <div 
                          key={completion.id}
                          className="border border-border bg-background p-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${
                              completion.status === "completed" ? "bg-green-500" : "bg-yellow-500"
                            }`} />
                            <span className="font-bold uppercase text-foreground">
                              {exercise?.name ?? "Unknown"}
                            </span>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
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
