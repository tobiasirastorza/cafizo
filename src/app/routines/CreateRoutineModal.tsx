"use client";

import { type DragEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { RiDraggable } from "@remixicon/react";
import {
  useCreateRoutineModal,
  type ExerciseOption,
} from "@/hooks/useCreateRoutineModal";

type CreateRoutineModalProps = {
  exercises: ExerciseOption[];
};

export default function CreateRoutineModal({ exercises }: CreateRoutineModalProps) {
  const t = useTranslations("Routines");
  const [searchByDay, setSearchByDay] = useState<Record<number, string>>({});
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<number | null>(null);
  const [dragOverExerciseIndex, setDragOverExerciseIndex] = useState<number | null>(null);
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
  } = useCreateRoutineModal({ t });

  const handleAddDay = () => {
    const nextIndex = days.length;
    addDay();
    setSelectedDayIndex(nextIndex);
  };

  const handleRemoveDay = (dayIndex: number) => {
    if (days.length === 1) return;

    removeDay(dayIndex);
    setSelectedDayIndex((current) => {
      if (current === dayIndex) return Math.max(0, dayIndex - 1);
      if (current > dayIndex) return current - 1;
      return current;
    });
  };

  const safeSelectedDayIndex =
    days.length === 0 ? 0 : Math.min(selectedDayIndex, days.length - 1);
  const selectedDay = days[safeSelectedDayIndex];

  const handleExerciseDragStart = (exerciseIndex: number) => {
    setDraggedExerciseIndex(exerciseIndex);
  };

  const handleExerciseDragOver = (
    event: DragEvent<HTMLDivElement>,
    exerciseIndex: number,
  ) => {
    event.preventDefault();
    if (dragOverExerciseIndex !== exerciseIndex) {
      setDragOverExerciseIndex(exerciseIndex);
    }
  };

  const handleExerciseDrop = (exerciseIndex: number) => {
    if (
      draggedExerciseIndex !== null &&
      draggedExerciseIndex !== exerciseIndex
    ) {
      moveExercise(safeSelectedDayIndex, draggedExerciseIndex, exerciseIndex);
    }
    setDraggedExerciseIndex(null);
    setDragOverExerciseIndex(null);
  };

  const handleExerciseDragEnd = () => {
    setDraggedExerciseIndex(null);
    setDragOverExerciseIndex(null);
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
            <div className="sticky top-0 z-20 border-b border-border-subtle bg-background-card/95 p-5 backdrop-blur-sm">
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
                    className={`h-10 w-full border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent ${
                      errorField === "name" ? "border-error/60" : "border-border"
                    }`}
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
                  onClick={handleAddDay}
                  disabled={!canAddDay}
                  className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted disabled:opacity-50"
                >
                  {t("create.actions.addDay")}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {days.map((day, dayIndex) => (
                    <button
                      key={`day-tab-${dayIndex}`}
                      type="button"
                      onClick={() => setSelectedDayIndex(dayIndex)}
                      className={`inline-flex h-10 shrink-0 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors duration-150 ${
                        dayIndex === safeSelectedDayIndex
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-background-card text-foreground hover:bg-background-muted"
                      }`}
                    >
                      {day.label?.trim() || `Day ${dayIndex + 1}`}
                    </button>
                  ))}
                </div>

                {selectedDay ? (
                  <section className="border border-border rounded-lg">
                    <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-background-muted p-4">
                      <input
                        value={selectedDay.label}
                        onChange={(e) => updateDayLabel(safeSelectedDayIndex, e.target.value)}
                        className="h-10 w-full max-w-xs border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                        placeholder={`Day ${safeSelectedDayIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveDay(safeSelectedDayIndex)}
                        disabled={days.length === 1}
                        className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted disabled:opacity-50"
                      >
                        {t("create.actions.removeDay")}
                      </button>
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="border border-border rounded-md p-3">
                        <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                          {t("create.labels.quickAdd")}
                        </div>
                        <input
                          value={searchByDay[safeSelectedDayIndex] ?? ""}
                          onChange={(e) =>
                            setSearchByDay((prev) => ({
                              ...prev,
                              [safeSelectedDayIndex]: e.target.value,
                            }))
                          }
                          className="mt-2 h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                          placeholder={t("create.placeholders.searchExercise")}
                        />
                        <div className="mt-3 max-h-36 overflow-y-auto border border-border-subtle rounded-md p-2">
                          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                            {exercises
                              .filter((option) =>
                                option.name
                                  .toLowerCase()
                                  .includes((searchByDay[safeSelectedDayIndex] ?? "").toLowerCase()),
                              )
                              .map((option) => {
                                const checked = selectedDay.exercises.some(
                                  (exercise) => exercise.exercise_id === option.id,
                                );
                                return (
                                  <label
                                    key={option.id}
                                    className="flex items-center gap-2 rounded-[4px] px-2 py-1 text-sm text-foreground transition-colors duration-150 hover:bg-background-muted"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) =>
                                        toggleExerciseInDay(
                                          safeSelectedDayIndex,
                                          option.id,
                                          e.target.checked,
                                        )
                                      }
                                      className="accent-accent"
                                    />
                                    <span className="truncate">{option.name}</span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>
                      </div>

                      {selectedDay.exercises.map((exercise, exerciseIndex) => {
                        const selectedExerciseName =
                          exercises.find((option) => option.id === exercise.exercise_id)
                            ?.name ?? t("create.placeholders.selectExercise");

                        return (
                          <div
                            key={`${safeSelectedDayIndex}-${exerciseIndex}`}
                            onDragOver={(event) =>
                              handleExerciseDragOver(event, exerciseIndex)
                            }
                            onDrop={() => handleExerciseDrop(exerciseIndex)}
                            className={`grid grid-cols-1 gap-3 border border-border rounded-md p-4 md:grid-cols-12 ${
                              dragOverExerciseIndex === exerciseIndex &&
                              draggedExerciseIndex !== null
                                ? "bg-accent/10"
                                : "bg-background-card"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 md:col-span-12">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  draggable
                                  onDragStart={() => handleExerciseDragStart(exerciseIndex)}
                                  onDragEnd={handleExerciseDragEnd}
                                  title={t("create.actions.dragToReorder")}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background-card text-foreground-secondary transition-colors duration-150 hover:bg-background-muted hover:text-foreground cursor-grab active:cursor-grabbing"
                                >
                                  <RiDraggable size={16} aria-hidden="true" />
                                </button>
                                <span className="inline-flex min-w-[2rem] items-center justify-center rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-sm font-semibold text-accent">
                                  #{exerciseIndex + 1}
                                </span>
                                <span className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">
                                  {selectedExerciseName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => removeExercise(safeSelectedDayIndex, exerciseIndex)}
                                  disabled={selectedDay.exercises.length === 1}
                                  className="inline-flex h-9 items-center justify-center border border-border bg-background-card px-3 text-xs font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted disabled:opacity-50"
                                >
                                  {t("create.actions.removeExercise")}
                                </button>
                              </div>
                            </div>

                          <label className="flex flex-col gap-2 md:col-span-4">
                            <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                              {t("create.labels.exercise")}
                            </span>
                            <select
                              value={exercise.exercise_id}
                              onChange={(e) =>
                                updateExercise(safeSelectedDayIndex, exerciseIndex, {
                                  exercise_id: e.target.value,
                                })
                              }
                              className={`h-10 w-full border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent ${
                                errorField === "exercise" ? "border-error/60" : "border-border"
                              }`}
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
                                updateExercise(safeSelectedDayIndex, exerciseIndex, {
                                  sets: e.target.value,
                                })
                              }
                              className={`h-10 w-full border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent ${
                                errorField === "sets" ? "border-error/60" : "border-border"
                              }`}
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
                                updateExercise(safeSelectedDayIndex, exerciseIndex, {
                                  reps: e.target.value,
                                })
                              }
                              className={`h-10 w-full border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent ${
                                errorField === "reps" ? "border-error/60" : "border-border"
                              }`}
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
                                updateExercise(safeSelectedDayIndex, exerciseIndex, {
                                  rest_seconds: e.target.value,
                                })
                              }
                              className={`h-10 w-full border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent ${
                                errorField === "rest" ? "border-error/60" : "border-border"
                              }`}
                              placeholder="90"
                            />
                          </label>

                          <label className="flex flex-col gap-2 md:col-span-12">
                            <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                              {t("create.labels.notes")}
                            </span>
                            <input
                              value={exercise.notes}
                              onChange={(e) =>
                                updateExercise(safeSelectedDayIndex, exerciseIndex, {
                                  notes: e.target.value,
                                })
                              }
                              className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                              placeholder={t("create.placeholders.notes")}
                            />
                          </label>

                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => addExercise(safeSelectedDayIndex)}
                        className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                      >
                        {t("create.actions.addExercise")}
                      </button>
                    </div>
                  </section>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
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
