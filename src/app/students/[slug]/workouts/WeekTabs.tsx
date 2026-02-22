"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/app/components/ToastProvider";

type Entry = {
  id: string;
  exerciseName: string;
  muscleGroup?: string;
  sets?: number;
  reps?: string;
  weight?: number;
  status: "completed" | "skipped";
};

type WeekData = {
  week: string;
  entries: Entry[];
};

type WeekTabsProps = {
  studentId: string;
  currentWeekKey: string;
  data: WeekData[];
};

const PB_BASE = "https://pb.barrani.app/api";

function buildUrl(path: string) {
  return `${PB_BASE}${path}`;
}

async function recalculateProgress(studentId: string, currentWeekKey: string) {
  const assignmentRes = await fetch(
    buildUrl(
      `/collections/student_routines/records?filter=${encodeURIComponent(
        `student_id="${studentId}" && status="active"`,
      )}&perPage=1`,
    ),
    { cache: "no-store" },
  );
  if (!assignmentRes.ok) return;

  const assignmentData = (await assignmentRes.json()) as {
    items: Array<{ id: string; routine_id: string }>;
  };
  const assignment = assignmentData.items[0];
  if (!assignment) return;

  const routineExercisesRes = await fetch(
    buildUrl(
      `/collections/routine_exercises/records?filter=${encodeURIComponent(
        `routine_id="${assignment.routine_id}"`,
      )}&perPage=500`,
    ),
    { cache: "no-store" },
  );
  if (!routineExercisesRes.ok) return;
  const routineExercisesData = (await routineExercisesRes.json()) as {
    items: Array<{ id: string }>;
  };
  const routineExerciseIds = new Set(routineExercisesData.items.map((item) => item.id));

  const completionsRes = await fetch(
    buildUrl(
      `/collections/exercise_completions/records?filter=${encodeURIComponent(
        `student_id="${studentId}" && week_key="${currentWeekKey}" && status="completed"`,
      )}&expand=routine_exercise_id&perPage=500`,
    ),
    { cache: "no-store" },
  );
  if (!completionsRes.ok) return;
  const completionsData = (await completionsRes.json()) as {
    items: Array<{
      routine_exercise_id?: string;
      expand?: { routine_exercise_id?: { id: string } };
    }>;
  };
  const completedInRoutine = new Set<string>();
  completionsData.items.forEach((item) => {
    const routineExerciseId = item.routine_exercise_id || item.expand?.routine_exercise_id?.id;
    if (routineExerciseId && routineExerciseIds.has(routineExerciseId)) {
      completedInRoutine.add(routineExerciseId);
    }
  });

  await fetch(buildUrl(`/collections/student_routines/records/${assignment.id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      progress_current: completedInRoutine.size,
      progress_total: routineExerciseIds.size,
    }),
  });
}

export function WeekTabs({ studentId, currentWeekKey, data }: WeekTabsProps) {
  const t = useTranslations("Workouts");
  const toast = useToast();
  const router = useRouter();
  const [activeWeek, setActiveWeek] = useState(data[0]?.week ?? "");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeData = data.find((d) => d.week === activeWeek);
  const entries = activeData?.entries ?? [];
  const completedCount = entries.filter((e) => e.status === "completed").length;
  const skippedCount = entries.filter((e) => e.status === "skipped").length;
  const handleDelete = async (entryId: string, week: string) => {
    setDeletingId(entryId);
    try {
      const res = await fetch(
        buildUrl(`/collections/exercise_completions/records/${entryId}`),
        { method: "DELETE" },
      );
      if (!res.ok && res.status !== 404) throw new Error(t("errors.deleteFailed"));
      if (week === currentWeekKey) {
        await recalculateProgress(studentId, currentWeekKey);
      }
      toast.success(t("actions.deleteSuccess"));
      router.refresh();
    } catch {
      toast.error(t("errors.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-10">
      {/* Week tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {data.map(({ week }) => (
          <button
            key={week}
            onClick={() => setActiveWeek(week)}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] transition-colors duration-150 rounded-md ${
              activeWeek === week
                ? "bg-background-active text-foreground"
                : "border border-border bg-background-card text-foreground-secondary hover:bg-background-muted hover:text-foreground"
            }`}
          >
            {week}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-6 flex gap-4 text-sm">
        <span className="text-accent font-medium">
          {t("stats.completed", { count: completedCount })}
        </span>
        {skippedCount > 0 && (
          <span className="text-foreground-secondary">
            {t("stats.skipped", { count: skippedCount })}
          </span>
        )}
      </div>

      {/* Entries */}
      <div className="mt-6 border border-border rounded-lg overflow-hidden">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={`grid gap-4 p-4 md:grid-cols-[minmax(0,2fr)_100px_100px_100px_100px] ${
              index % 2 === 0 ? "bg-background-card" : "bg-background-muted/30"
            } ${index !== entries.length - 1 ? "border-b border-border" : ""}`}
          >
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("table.exercise")}
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.exerciseName}
              </div>
              {entry.muscleGroup && (
                <div className="mt-1 text-xs uppercase tracking-[0.08em] text-foreground-muted">
                  {entry.muscleGroup}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("table.sets")}
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.sets ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("table.reps")}
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.reps ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("table.weight")}
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.weight ? `${entry.weight}kg` : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("table.status")}
              </div>
              <div
                className={`mt-1 text-sm font-medium ${
                  entry.status === "completed"
                    ? "text-accent"
                    : "text-foreground-secondary"
                }`}
              >
                {entry.status === "completed" ? t("status.completed") : t("status.skipped")}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(entry.id, activeWeek)}
                disabled={deletingId === entry.id}
                className="mt-2 inline-flex h-8 items-center justify-center border border-red-500 bg-red-500 px-3 text-xs font-medium text-white rounded-md transition-colors duration-150 hover:bg-red-600 disabled:opacity-60"
              >
                {deletingId === entry.id ? t("actions.deleting") : t("actions.deleteLog")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
