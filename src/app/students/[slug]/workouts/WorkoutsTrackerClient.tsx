"use client";

import { useTranslations } from "next-intl";
import { useToast } from "@/app/components/ToastProvider";
import { useWorkoutsTracker, type WorkoutEntry } from "@/hooks/useWorkoutsTracker";

type WorkoutsTrackerClientProps = {
  studentId: string;
  activeRoutineName: string | null;
  currentWeekKey: string;
  currentWeekLabel: string;
  entries: WorkoutEntry[];
};

export default function WorkoutsTrackerClient({
  studentId,
  activeRoutineName,
  currentWeekKey,
  currentWeekLabel,
  entries,
}: WorkoutsTrackerClientProps) {
  const t = useTranslations("Workouts");
  const toast = useToast();
  const {
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
  } = useWorkoutsTracker({ studentId, currentWeekKey, entries, t, toast });

  if (!activeRoutineName) {
    return (
      <section className="mt-8 border border-border bg-background-card rounded-lg p-5">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
          {t("tracker.kicker")}
        </div>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          {t("tracker.noActiveRoutineTitle")}
        </h2>
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
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              {activeRoutineName}
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              {t("tracker.week", { key: currentWeekLabel })}
            </p>
            <p className="mt-1 text-xs text-foreground-muted">
              {t("tracker.weekRule")}
            </p>
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
                    <div
                      key={entry.routineExerciseId}
                      className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium text-foreground">{entry.exerciseName}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-secondary">
                          {entry.muscleGroup ? (
                            <span className="uppercase tracking-[0.08em]">{entry.muscleGroup}</span>
                          ) : null}
                          {entry.targetSets || entry.targetReps ? (
                            <span>
                              {t("tracker.target", {
                                sets: entry.targetSets || "-",
                                reps: entry.targetReps || "-",
                              })}
                            </span>
                          ) : null}
                          {entry.lastStatus ? (
                            <span
                              className={
                                entry.lastStatus === "completed"
                                  ? "text-accent"
                                  : "text-foreground-secondary"
                              }
                            >
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
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("modal.kicker")}
              </div>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{selected.exerciseName}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                  {t("modal.status")}
                </span>
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
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                  {t("modal.completedAt")}
                </span>
                <input
                  type="datetime-local"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                  {t("table.sets")}
                </span>
                <input
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                  placeholder={t("placeholders.sets")}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                  {t("table.reps")}
                </span>
                <input
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                  placeholder={t("placeholders.reps")}
                />
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                  {t("table.weight")}
                </span>
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
