"use client";

import { useTranslations } from "next-intl";
import {
  useCreateRoutineModal,
  type ExerciseOption,
} from "@/hooks/useCreateRoutineModal";

type CreateRoutineModalProps = {
  exercises: ExerciseOption[];
};

export default function CreateRoutineModal({ exercises }: CreateRoutineModalProps) {
  const t = useTranslations("Routines");
  const {
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
  } = useCreateRoutineModal({ t });

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
                        <div
                          key={`${dayIndex}-${exerciseIndex}`}
                          className="grid grid-cols-1 gap-3 border border-border rounded-md p-4 md:grid-cols-12"
                        >
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
                              onChange={(e) =>
                                updateExercise(dayIndex, exerciseIndex, { sets: e.target.value })
                              }
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
                              onChange={(e) =>
                                updateExercise(dayIndex, exerciseIndex, { reps: e.target.value })
                              }
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
                              onChange={(e) =>
                                updateExercise(dayIndex, exerciseIndex, { notes: e.target.value })
                              }
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
