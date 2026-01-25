"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useStudentIntake from "@/hooks/useStudentIntake";
import { useTranslations } from "next-intl";

type Exercise = {
  id: string;
  name: string;
  muscle_group?: string;
  exercise_type?: string;
};

type DayExercise = {
  id: string;
  exercise_id: string;
  sets: string;
  reps: string;
  rest_seconds: string;
  notes: string;
};

type RoutineDay = {
  id: string;
  label: string;
  exercises: DayExercise[];
};

function createExerciseRow(): DayExercise {
  return {
    id: crypto.randomUUID(),
    exercise_id: "",
    sets: "",
    reps: "",
    rest_seconds: "",
    notes: "",
  };
}

export default function NewStudentForm({ exercises }: { exercises: Exercise[] }) {
  const t = useTranslations("NewStudentForm");
  const router = useRouter();
  const { createStudentWithRoutine } = useStudentIntake();
  const createDay = (dayNumber: number): RoutineDay => ({
    id: crypto.randomUUID(),
    label: `${t("day")} ${dayNumber}`,
    exercises: [createExerciseRow()],
  });
  const [days, setDays] = useState<RoutineDay[]>([createDay(1)]);
  const [activeDayId, setActiveDayId] = useState(days[0].id);
  const [expandedExercises, setExpandedExercises] = useState<string[]>([]);
  const [notesOpenIds, setNotesOpenIds] = useState<string[]>([]);
  const [routineName, setRoutineName] = useState("");
  const [routineLevel, setRoutineLevel] = useState("beginner");
  const [routineSplit, setRoutineSplit] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const exerciseOptions = useMemo(
    () =>
      exercises.map((exercise) => ({
        id: exercise.id,
        label: `${exercise.name} · ${
          exercise.exercise_type ?? t("exerciseType.general")
        }`,
      })),
    [exercises, t],
  );

  const addDay = () => {
    setDays((prev) => {
      const nextDay = createDay(prev.length + 1);
      setActiveDayId(nextDay.id);
      return [...prev, nextDay];
    });
  };

  const addExerciseToDay = (dayId: string) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? { ...day, exercises: [...day.exercises, createExerciseRow()] }
          : day,
      ),
    );
  };

  const updateExercise = (
    dayId: string,
    exerciseId: string,
    field: keyof DayExercise,
    value: string,
  ) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises: day.exercises.map((entry) =>
                entry.id === exerciseId ? { ...entry, [field]: value } : entry,
              ),
            }
          : day,
      ),
    );
  };

  const removeExercise = (dayId: string, exerciseId: string) => {
    setDays((prev) =>
      prev.map((day) =>
        day.id === dayId
          ? {
              ...day,
              exercises:
                day.exercises.length > 1
                  ? day.exercises.filter((entry) => entry.id !== exerciseId)
                  : day.exercises,
            }
          : day,
      ),
    );
    setExpandedExercises((prev) => prev.filter((id) => id !== exerciseId));
    setNotesOpenIds((prev) => prev.filter((id) => id !== exerciseId));
  };

  const removeDay = (dayId: string) => {
    setDays((prev) => {
      if (prev.length <= 1) return prev;
      const nextDays = prev.filter((day) => day.id !== dayId);
      if (activeDayId === dayId) {
        setActiveDayId(nextDays[0].id);
      }
      return nextDays;
    });
  };

  const toggleExercise = (exerciseId: string) => {
    setExpandedExercises((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId],
    );
  };

  const toggleNotes = (exerciseId: string) => {
    setNotesOpenIds((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId],
    );
  };

  const handleSubmit = async () => {
    setFormError(null);
    setSuccess(null);

    if (!studentName.trim()) {
      setFormError(t("errors.studentNameRequired"));
      return;
    }

    if (!routineName.trim()) {
      setFormError(t("errors.routineNameRequired"));
      return;
    }

    if (!routineSplit.trim()) {
      setFormError(t("errors.routineSplitRequired"));
      return;
    }

    const hasEmptyExercise = days.some((day) =>
      day.exercises.some((exercise) => !exercise.exercise_id),
    );
    if (hasEmptyExercise) {
      setFormError(t("errors.exerciseRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createStudentWithRoutine({
        student: {
          name: studentName.trim(),
          status: "active",
        },
        routine: {
          name: routineName.trim(),
          days_per_week: days.length,
          level: routineLevel,
          split: routineSplit.trim(),
        },
        days: days.map((day) => ({
          label: day.label,
          exercises: day.exercises.map((exercise) => ({
            exercise_id: exercise.exercise_id,
            sets: exercise.sets || undefined,
            reps: exercise.reps || undefined,
            rest_seconds: exercise.rest_seconds
              ? Number(exercise.rest_seconds)
              : undefined,
            notes: exercise.notes || undefined,
          })),
        })),
      });

      setStudentName("");
      setRoutineName("");
      setRoutineLevel("beginner");
      setRoutineSplit("");
      const resetDay = createDay(1);
      setDays([resetDay]);
      setActiveDayId(resetDay.id);
      setExpandedExercises([]);
      setNotesOpenIds([]);
      setSuccess(t("success.created"));
      router.push(`/students/${result.studentId}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDay = days.find((day) => day.id === activeDayId) ?? days[0];
  const hasNamedStudent = studentName.trim().length > 0;
  const hasAtLeastOneExercise = days.some((day) =>
    day.exercises.some((exercise) => exercise.exercise_id),
  );
  const canSubmit = hasNamedStudent && hasAtLeastOneExercise && !isSubmitting;

  return (
    <form className="bg-background">
      <div className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="space-y-8 border-b border-border px-6 py-10 lg:border-b-0 lg:border-r lg:px-10">
          <div>
            <label
              htmlFor="name"
              className="text-xs font-bold uppercase tracking-[0.45em] text-muted-foreground"
            >
              {t("labels.studentName")} <span className="text-xs text-accent">*</span>
            </label>
            <input
              id="name"
              name="name"
              placeholder={t("placeholders.fullName")}
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              className="mt-4 h-12 w-full border-b border-border bg-transparent px-1 text-2xl font-semibold uppercase tracking-tight text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <div className="flex items-center gap-4">
              <span className="h-[2px] w-10 bg-accent" aria-hidden="true" />
              <div className="text-xs font-bold uppercase tracking-[0.45em] text-foreground">
                {t("sections.routineConfig")}
              </div>
            </div>
            <div>
              <label
                htmlFor="routine_name"
                className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground"
              >
                {t("labels.routineName")}
              </label>
              <input
                id="routine_name"
                name="routine_name"
                placeholder={t("placeholders.routineName")}
                value={routineName}
                onChange={(event) => setRoutineName(event.target.value)}
                className="mt-3 h-12 w-full border-b border-border bg-transparent px-1 text-lg font-semibold uppercase tracking-tight text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="routine_level"
                  className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground"
                >
                  {t("labels.experienceLevel")}
                </label>
                <select
                  id="routine_level"
                  name="routine_level"
                  value={routineLevel}
                  onChange={(event) => setRoutineLevel(event.target.value)}
                  className="mt-3 h-11 w-full border-b border-border bg-background px-1 text-base font-semibold uppercase tracking-widest text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="beginner">{t("levels.beginner")}</option>
                  <option value="intermediate">{t("levels.intermediate")}</option>
                  <option value="advanced">{t("levels.advanced")}</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="routine_split"
                  className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground"
                >
                  {t("labels.splitType")}
                </label>
                <input
                  id="routine_split"
                  name="routine_split"
                  placeholder={t("placeholders.splitType")}
                  value={routineSplit}
                  onChange={(event) => setRoutineSplit(event.target.value)}
                  className="mt-3 h-11 w-full border-b border-border bg-transparent px-1 text-base font-semibold uppercase tracking-tight text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <div className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">
              {t("sections.trainingDays")}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {days.map((day) => {
                const isActive = day.id === activeDayId;
                const exerciseCount = day.exercises.filter(
                  (exercise) => exercise.exercise_id,
                ).length;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayId(day.id)}
                    className={`flex h-12 items-center gap-2 border-2 px-4 text-sm font-bold uppercase tracking-widest transition-colors ${
                      isActive
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{day.label}</span>
                    <span className="text-xs">
                      {t("exerciseCount", { count: exerciseCount })}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={addDay}
                className="inline-flex h-12 items-center gap-2 border-2 border-border px-4 text-sm font-bold uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                {t("actions.addDay")}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-8 px-6 py-10 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-4xl font-black uppercase italic tracking-tight text-foreground md:text-6xl">
              {activeDay?.label ?? t("day")}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => addExerciseToDay(activeDay.id)}
                className="inline-flex h-12 w-12 items-center justify-center border-2 border-border text-lg font-bold text-foreground transition-colors hover:border-accent hover:text-accent"
                aria-label={t("actions.addExercise")}
              >
                +
              </button>
              {days.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeDay(activeDay.id)}
                  className="inline-flex h-12 w-12 items-center justify-center border-2 border-border text-lg font-bold text-foreground transition-colors hover:border-red-500 hover:text-red-400"
                  aria-label={t("actions.removeDay")}
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>

          {activeDay ? (
            <div className="space-y-5">
              {activeDay.exercises.map((entry, entryIndex) => {
                const isExpanded = expandedExercises.includes(entry.id);
                const isNotesOpen = notesOpenIds.includes(entry.id);
                const selectedLabel = entry.exercise_id
                  ? exerciseOptions.find(
                      (option) => option.id === entry.exercise_id,
                    )?.label
                  : t("exercise.unassigned");
                return (
                  <div
                    key={entry.id}
                    className="border-2 border-border bg-background p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.35em] text-accent">
                          {t("exercise.label", {
                            number: String(entryIndex + 1).padStart(2, "0"),
                          })}
                        </div>
                        <div className="mt-3 text-2xl font-black uppercase tracking-tight text-foreground">
                          {selectedLabel}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">
                          {t("exercise.setsReps")}
                        </div>
                        <div className="mt-2 text-lg font-bold uppercase tracking-tight text-foreground">
                          {entry.sets ? entry.sets : "—"} x{" "}
                          {entry.reps ? entry.reps : "—"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <button
                            type="button"
                            onClick={() => removeExercise(activeDay.id, entry.id)}
                            className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/80 transition-colors duration-200 hover:text-red-400"
                          >
                            {t("actions.remove")}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => toggleExercise(entry.id)}
                          aria-label={
                            isExpanded
                              ? t("actions.collapseExercise")
                              : t("actions.expandExercise")
                          }
                          className="inline-flex h-10 w-10 items-center justify-center border-2 border-border text-muted-foreground transition-colors duration-200 hover:border-accent hover:text-accent"
                        >
                          <span
                            aria-hidden="true"
                            className={`text-lg transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          >
                            ▾
                          </span>
                        </button>
                      </div>
                    </div>

                    {!isExpanded ? (
                      <div className="mt-6 grid gap-4 border-t border-border pt-4 text-sm font-semibold uppercase tracking-widest text-foreground md:grid-cols-4">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">
                            {t("exercise.rest")}
                          </div>
                          <div className="mt-2">
                            {entry.rest_seconds ? `${entry.rest_seconds}s` : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">
                            {t("exercise.rpe")}
                          </div>
                          <div className="mt-2">{entry.notes ? "8.5" : "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">
                            {t("exercise.tempo")}
                          </div>
                          <div className="mt-2">{entry.notes ? "3-0-1-0" : "—"}</div>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">
                          <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
                          {t("exercise.live")}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 grid gap-4 border-t border-border pt-4 md:grid-cols-[minmax(0,2fr)_90px_90px_120px_auto]">
                        <div>
                          <label
                            htmlFor={`exercise-${entryIndex}`}
                            className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground"
                          >
                            {t("exercise.change")}
                          </label>
                          <select
                            id={`exercise-${entryIndex}`}
                            value={entry.exercise_id}
                            onChange={(event) =>
                              updateExercise(
                                activeDay.id,
                                entry.id,
                                "exercise_id",
                                event.target.value,
                              )
                            }
                            className="mt-2 h-10 w-full border-2 border-border bg-background px-3 text-sm font-semibold uppercase tracking-widest text-foreground focus:border-accent focus:outline-none"
                          >
                            <option value="">{t("exercise.select")}</option>
                            {exerciseOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`sets-${entryIndex}`}
                            className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground"
                          >
                            {t("exercise.sets")}
                          </label>
                          <input
                            id={`sets-${entryIndex}`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={entry.sets}
                            onChange={(event) =>
                              updateExercise(
                                activeDay.id,
                                entry.id,
                                "sets",
                                event.target.value,
                              )
                            }
                          placeholder={t("placeholders.sets")}
                            className="mt-2 h-10 w-full border-2 border-border bg-transparent px-3 text-sm font-semibold uppercase tracking-widest text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                          />
                        </div>

                        <div>
                        <label
                          htmlFor={`reps-${entryIndex}`}
                          className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground"
                        >
                          {t("exercise.reps")}
                        </label>
                          <input
                            id={`reps-${entryIndex}`}
                            inputMode="text"
                            value={entry.reps}
                            onChange={(event) =>
                              updateExercise(
                                activeDay.id,
                                entry.id,
                                "reps",
                                event.target.value,
                              )
                            }
                          placeholder={t("placeholders.reps")}
                            className="mt-2 h-10 w-full border-2 border-border bg-transparent px-3 text-sm font-semibold uppercase tracking-widest text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                          />
                        </div>

                        <div>
                        <label
                          htmlFor={`rest-${entryIndex}`}
                          className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground"
                        >
                          {t("exercise.restSeconds")}
                        </label>
                          <input
                            id={`rest-${entryIndex}`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={entry.rest_seconds}
                            onChange={(event) =>
                              updateExercise(
                                activeDay.id,
                                entry.id,
                                "rest_seconds",
                                event.target.value,
                              )
                            }
                          placeholder={t("placeholders.rest")}
                            className="mt-2 h-10 w-full border-2 border-border bg-transparent px-3 text-sm font-semibold uppercase tracking-widest text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                          />
                        </div>

                        <div className="flex items-end gap-3">
                          <button
                            type="button"
                            onClick={() => toggleNotes(entry.id)}
                            className="h-10 border-2 border-border px-4 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-200 hover:border-accent hover:text-accent"
                          >
                          {isNotesOpen
                            ? t("actions.hideNote")
                            : t("actions.addNote")}
                          </button>
                        </div>
                        {isNotesOpen ? (
                          <div className="md:col-span-5">
                          <label
                            htmlFor={`notes-${entryIndex}`}
                            className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground"
                          >
                            {t("exercise.notes")}
                          </label>
                            <textarea
                              id={`notes-${entryIndex}`}
                              value={entry.notes}
                              onChange={(event) =>
                                updateExercise(
                                  activeDay.id,
                                  entry.id,
                                  "notes",
                                  event.target.value,
                                )
                              }
                              placeholder={t("placeholders.notes")}
                              rows={3}
                              className="mt-2 w-full border-2 border-border bg-transparent px-3 py-2 text-sm font-semibold uppercase tracking-widest text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                            />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => addExerciseToDay(activeDay.id)}
                className="flex w-full flex-col items-center justify-center gap-4 border-2 border-dashed border-border py-10 text-sm font-bold uppercase tracking-[0.35em] text-muted-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <span className="inline-flex h-14 w-14 items-center justify-center border-2 border-accent bg-accent text-2xl font-black text-accent-foreground">
                  +
                </span>
                {t("actions.addExerciseToDay", { day: activeDay.label })}
              </button>
            </div>
          ) : null}
        </section>
      </div>

      <section className="sticky bottom-0 z-10 flex flex-wrap items-center gap-4 border-t border-border bg-background/95 px-6 py-4 backdrop-blur md:px-10">
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex h-14 items-center justify-center border-2 border-accent bg-accent px-10 text-base font-black uppercase tracking-[0.2em] text-accent-foreground transition-transform duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 md:text-lg"
          disabled={!canSubmit}
        >
          {t("actions.createStudentRoutine")}
        </button>
        <Link
          href="/students"
          className="inline-flex h-12 items-center justify-center border-2 border-border px-8 text-sm font-bold uppercase tracking-[0.2em] text-foreground/80 transition-colors duration-200 hover:bg-foreground hover:text-background"
        >
          {t("actions.cancel")}
        </Link>
        <button
          type="reset"
          className="inline-flex h-12 items-center justify-center text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/80 transition-colors duration-200 hover:text-foreground"
        >
          {t("actions.resetForm")}
        </button>
        {!hasNamedStudent || !hasAtLeastOneExercise ? (
          <div className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">
            {hasNamedStudent
              ? t("errors.addExerciseRequired")
              : t("errors.studentNameRequiredContinue")}
          </div>
        ) : null}
        {formError ? (
          <div className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
            {formError}
          </div>
        ) : null}
        {success ? (
          <div className="text-xs font-bold uppercase tracking-[0.35em] text-accent">
            {success}
          </div>
        ) : null}
      </section>
    </form>
  );
}
