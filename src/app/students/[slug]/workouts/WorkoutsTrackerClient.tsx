"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/app/components/ToastProvider";

type Entry = {
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

type WorkoutsTrackerClientProps = {
  studentId: string;
  activeRoutineName: string | null;
  currentWeekKey: string;
  entries: Entry[];
};

const PB_BASE = "https://pb.barrani.app/api";

function buildUrl(path: string) {
  return `${PB_BASE}${path}`;
}

function toLocalDatetimeInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
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

  if (!assignmentRes.ok) {
    const detail = await assignmentRes.text().catch(() => "");
    throw new Error(detail || "Failed to load active routine assignment.");
  }

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
  if (!routineExercisesRes.ok) {
    const detail = await routineExercisesRes.text().catch(() => "");
    throw new Error(detail || "Failed to load routine exercises.");
  }

  const routineExercisesData = (await routineExercisesRes.json()) as {
    items: Array<{ id: string }>;
  };
  const routineExerciseIds = new Set(routineExercisesData.items.map((item) => item.id));
  const progressTotal = routineExerciseIds.size;

  const completionsRes = await fetch(
    buildUrl(
      `/collections/exercise_completions/records?filter=${encodeURIComponent(
        `student_id="${studentId}" && week_key="${currentWeekKey}" && status="completed"`,
      )}&expand=routine_exercise_id&perPage=500`,
    ),
    { cache: "no-store" },
  );
  if (!completionsRes.ok) {
    const detail = await completionsRes.text().catch(() => "");
    throw new Error(detail || "Failed to load completions.");
  }

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

  const progressCurrent = completedInRoutine.size;

  const updateRes = await fetch(
    buildUrl(`/collections/student_routines/records/${assignment.id}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        progress_current: progressCurrent,
        progress_total: progressTotal,
      }),
    },
  );

  if (!updateRes.ok) {
    const detail = await updateRes.text().catch(() => "");
    throw new Error(detail || "Failed to update routine progress.");
  }
}

export default function WorkoutsTrackerClient({
  studentId,
  activeRoutineName,
  currentWeekKey,
  entries,
}: WorkoutsTrackerClientProps) {
  const t = useTranslations("Workouts");
  const toast = useToast();
  const router = useRouter();
  const [selected, setSelected] = useState<Entry | null>(null);
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
    }, {} as Record<string, Entry[]>);

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

  const openLogModal = (entry: Entry) => {
    const normalizedTargetSets =
      entry.targetSets === undefined || entry.targetSets === null
        ? ""
        : String(entry.targetSets);
    const normalizedTargetReps =
      entry.targetReps === undefined || entry.targetReps === null
        ? ""
        : String(entry.targetReps);
    setSelected(entry);
    setStatus(entry.lastStatus ?? "completed");
    setSets(entry.lastSets !== undefined ? String(entry.lastSets) : normalizedTargetSets);
    setReps(entry.lastReps !== undefined ? String(entry.lastReps) : normalizedTargetReps);
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
      const setsValue = String(sets ?? "").trim();
      const repsValue = String(reps ?? "").trim();
      const weightValue = String(weight ?? "").trim();

      const isUpdate = Boolean(selected.lastCompletionId);
      const endpoint = isUpdate
        ? buildUrl(`/collections/exercise_completions/records/${selected.lastCompletionId}`)
        : buildUrl("/collections/exercise_completions/records");
      const method = isUpdate ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
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

      await recalculateProgress(studentId, currentWeekKey);
      toast.success(t("actions.saveSuccess"));
      closeModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeLogById = async (completionId: string) => {
    const confirmed = window.confirm(t("actions.deleteConfirm"));
    if (!confirmed) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(
        buildUrl(`/collections/exercise_completions/records/${completionId}`),
        { method: "DELETE" },
      );

      if (!res.ok && res.status !== 404) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || t("errors.deleteFailed"));
      }

      await recalculateProgress(studentId, currentWeekKey);
      toast.success(t("actions.deleteSuccess"));
      closeModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.deleteFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeLog = async () => {
    if (!selected?.lastCompletionId) return;
    await removeLogById(selected.lastCompletionId);
  };

  if (!activeRoutineName) {
    return (
      <section className="mt-8 border border-border bg-background-card rounded-lg p-5">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
          {t("tracker.kicker")}
        </div>
        <h2 className="mt-2 text-xl font-semibold text-foreground">{t("tracker.noActiveRoutineTitle")}</h2>
        <p className="mt-2 text-sm text-foreground-secondary">
          {t("tracker.noActiveRoutineBody")}
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="mt-8 border border-border bg-background-card rounded-lg p-5">
        <div className="flex flex-col gap-4 border-b border-border-subtle pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
              {t("tracker.kicker")}
            </div>
            <h2 className="mt-2 text-xl font-semibold text-foreground">{activeRoutineName}</h2>
            <p className="mt-1 text-sm text-foreground-secondary">{t("tracker.week", { key: currentWeekKey })}</p>
            <p className="mt-1 text-xs text-foreground-muted">{t("tracker.weekRule")}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-[4px] bg-background-muted px-2 py-1 font-medium text-foreground">
              {t("stats.progress", { completed: completedCount, total: totalCount })}
            </span>
            <span className="rounded-[4px] bg-accent/10 px-2 py-1 font-medium text-accent">
              {t("stats.completed", { count: completedCount })}
            </span>
            <span className="rounded-[4px] bg-background-muted px-2 py-1 font-medium text-foreground-secondary">
              {t("stats.skipped", { count: skippedCount })}
            </span>
            {isWeekCompleted ? (
              <span className="rounded-[4px] bg-success/10 px-2 py-1 font-medium text-success">
                {t("stats.weekCompleted")}
              </span>
            ) : null}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="pt-5 text-sm text-foreground-secondary">
            {t("tracker.noExercises")}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {byDay.map((day) => (
              <div key={day.key} className="border border-border rounded-lg overflow-hidden">
                <div className="border-b border-border-subtle bg-background-muted px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                  {day.dayLabel}
                </div>

                <div className="divide-y divide-border">
                  {day.items.map((entry) => (
                    <div key={entry.routineExerciseId} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground">{entry.exerciseName}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-secondary">
                          {entry.muscleGroup ? <span className="uppercase tracking-[0.08em]">{entry.muscleGroup}</span> : null}
                          {entry.targetSets || entry.targetReps ? (
                            <span>
                              {t("tracker.target", {
                                sets: entry.targetSets || "-",
                                reps: entry.targetReps || "-",
                              })}
                            </span>
                          ) : null}
                          {entry.lastStatus ? (
                            <span className={entry.lastStatus === "completed" ? "text-accent" : "text-foreground-secondary"}>
                              {entry.lastStatus === "completed"
                                ? t("tracker.lastCompleted")
                                : t("tracker.lastSkipped")}
                            </span>
                          ) : (
                            <span>{t("tracker.lastNotLogged")}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openLogModal(entry)}
                          className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                        >
                          {entry.lastStatus === "completed"
                            ? t("actions.editLog")
                            : t("actions.logSet")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
          <div
            className="w-full max-w-lg border border-border bg-background-card rounded-lg"
            style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
          >
            <div className="border-b border-border-subtle p-5">
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">{t("modal.kicker")}</div>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{selected.exerciseName}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">{t("modal.status")}</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "completed" | "skipped")}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                >
                  <option value="completed">{t("status.completed")}</option>
                  <option value="skipped">{t("status.skipped")}</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">{t("modal.completedAt")}</span>
                <input
                  type="datetime-local"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">{t("table.sets")}</span>
                <input
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                  placeholder={t("placeholders.sets")}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">{t("table.reps")}</span>
                <input
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                  placeholder={t("placeholders.reps")}
                />
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">{t("table.weight")}</span>
                <input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                  placeholder={t("placeholders.weight")}
                />
              </label>

              {error ? (
                <div className="md:col-span-2 rounded-[4px] border border-error/20 bg-error/10 px-3 py-2 text-sm text-error">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border-subtle p-5">
              {selected.lastCompletionId ? (
                <button
                  type="button"
                  onClick={removeLog}
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center justify-center border border-error bg-error px-4 text-sm font-medium text-white rounded-md transition-colors duration-150 hover:bg-error/90 disabled:opacity-60"
                >
                  {t("actions.deleteLog")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted disabled:opacity-50"
              >
                {t("actions.cancel")}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90 disabled:opacity-60"
              >
                {isSubmitting ? t("actions.saving") : t("actions.saveLog")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
