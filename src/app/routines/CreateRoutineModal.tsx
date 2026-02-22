"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type ExerciseOption = {
  id: string;
  name: string;
  muscle_group?: string;
};

type DayExercise = {
  exercise_id: string;
  sets: string;
  reps: string;
  rest_seconds: string;
  notes: string;
};

type DayPlan = {
  label: string;
  exercises: DayExercise[];
};

const PB_BASE = "https://pb.barrani.app/api";
const DEFAULT_TRAINER_ID = process.env.NEXT_PUBLIC_DEFAULT_TRAINER_ID ?? "";

function buildUrl(path: string) {
  return `${PB_BASE}${path}`;
}

function blankExercise(): DayExercise {
  return {
    exercise_id: "",
    sets: "",
    reps: "",
    rest_seconds: "",
    notes: "",
  };
}

type CreateRoutineModalProps = {
  exercises: ExerciseOption[];
};

export default function CreateRoutineModal({ exercises }: CreateRoutineModalProps) {
  const t = useTranslations("Routines");
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
      {
        label: `Day ${prev.length + 1}`,
        exercises: [blankExercise()],
      },
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
      const routineRes = await fetch(buildUrl("/collections/routines/records"), {
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
          fetch(buildUrl("/collections/routine_exercises/records"), {
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

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center gap-2 border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90"
      >
        <span aria-hidden="true">+</span>
        {t("actions.create")}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-border bg-background-card rounded-lg"
            style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
          >
            <div className="border-b border-border-subtle p-5">
              <h2 className="text-xl font-semibold text-foreground">{t("create.title")}</h2>
              <p className="mt-2 text-sm text-foreground-secondary">{t("create.subtitle")}</p>
            </div>

            <div className="space-y-6 p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                    {t("create.labels.name")}
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                    placeholder={t("create.placeholders.name")}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                    {t("create.labels.level")}
                  </span>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                  >
                    <option value="beginner">{t("levels.beginner")}</option>
                    <option value="intermediate">{t("levels.intermediate")}</option>
                    <option value="advanced">{t("levels.advanced")}</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                    {t("create.trainingDays")}
                  </div>
                  <div className="mt-1 text-sm text-foreground-secondary">
                    {t("create.summary", { days: days.length, exercises: totalExercises })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addDay}
                  disabled={!canAddDay}
                  className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted disabled:opacity-50"
                >
                  {t("create.actions.addDay")}
                </button>
              </div>

              <div className="space-y-4">
                {days.map((day, dayIndex) => (
                  <section key={`${dayIndex}-${day.label}`} className="border border-border rounded-lg">
                    <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-background-muted p-4">
                      <input
                        value={day.label}
                        onChange={(e) => updateDayLabel(dayIndex, e.target.value)}
                        className="h-10 w-full max-w-xs border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                        placeholder={`Day ${dayIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeDay(dayIndex)}
                        disabled={days.length === 1}
                        className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted disabled:opacity-50"
                      >
                        {t("create.actions.removeDay")}
                      </button>
                    </div>

                    <div className="space-y-3 p-4">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <div key={`${dayIndex}-${exerciseIndex}`} className="grid grid-cols-1 gap-3 border border-border rounded-md p-4 md:grid-cols-12">
                          <label className="flex flex-col gap-2 md:col-span-4">
                            <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                              {t("create.labels.exercise")}
                            </span>
                            <select
                              value={exercise.exercise_id}
                              onChange={(e) =>
                                updateExercise(dayIndex, exerciseIndex, {
                                  exercise_id: e.target.value,
                                })
                              }
                              className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                            >
                              <option value="">{t("create.placeholders.selectExercise")}</option>
                              {exercises.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                  {option.muscle_group ? ` (${option.muscle_group})` : ""}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="flex flex-col gap-2 md:col-span-2">
                            <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                              {t("create.labels.sets")}
                            </span>
                            <input
                              value={exercise.sets}
                              onChange={(e) => updateExercise(dayIndex, exerciseIndex, { sets: e.target.value })}
                              className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                              placeholder="3"
                            />
                          </label>

                          <label className="flex flex-col gap-2 md:col-span-2">
                            <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                              {t("create.labels.reps")}
                            </span>
                            <input
                              value={exercise.reps}
                              onChange={(e) => updateExercise(dayIndex, exerciseIndex, { reps: e.target.value })}
                              className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                              placeholder="8-10"
                            />
                          </label>

                          <label className="flex flex-col gap-2 md:col-span-2">
                            <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                              {t("create.labels.rest")}
                            </span>
                            <input
                              value={exercise.rest_seconds}
                              onChange={(e) =>
                                updateExercise(dayIndex, exerciseIndex, {
                                  rest_seconds: e.target.value,
                                })
                              }
                              className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                              placeholder="90"
                            />
                          </label>

                          <label className="flex flex-col gap-2 md:col-span-10">
                            <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                              {t("create.labels.notes")}
                            </span>
                            <input
                              value={exercise.notes}
                              onChange={(e) => updateExercise(dayIndex, exerciseIndex, { notes: e.target.value })}
                              className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                              placeholder={t("create.placeholders.notes")}
                            />
                          </label>

                          <div className="flex items-end justify-end md:col-span-2">
                            <button
                              type="button"
                              onClick={() => removeExercise(dayIndex, exerciseIndex)}
                              disabled={day.exercises.length === 1}
                              className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted disabled:opacity-50"
                            >
                              {t("create.actions.removeExercise")}
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addExercise(dayIndex)}
                        className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                      >
                        {t("create.actions.addExercise")}
                      </button>
                    </div>
                  </section>
                ))}
              </div>

              {error ? (
                <div className="rounded-[4px] border border-error/20 bg-error/10 px-3 py-2 text-sm text-error">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border-subtle p-5">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted disabled:opacity-50"
              >
                {t("create.actions.cancel")}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90 disabled:opacity-60"
              >
                {isSubmitting ? t("create.actions.creating") : t("create.actions.submit")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
