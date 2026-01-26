"use client";

import { useMemo, useState } from "react";

import useExercises, { Exercise } from "@/hooks/useExercises";
import { useTranslations } from "next-intl";

type Draft = {
  name: string;
  muscle_group: string;
  exercise_type: string;
};

const filters = [
  { value: "All", labelKey: "filters.all" },
  { value: "Legs", labelKey: "filters.legs" },
  { value: "Back", labelKey: "filters.back" },
  { value: "Chest", labelKey: "filters.chest" },
  { value: "Shoulders", labelKey: "filters.shoulders" },
  { value: "Arms", labelKey: "filters.arms" },
  { value: "Core", labelKey: "filters.core" },
];
const muscleGroups = filters.filter((item) => item.value !== "All");
const exerciseTypes = [{ value: "Hypertrophy", labelKey: "types.hypertrophy" }];

function emptyDraft(): Draft {
  return { name: "", muscle_group: "", exercise_type: "" };
}

export default function ExercisesClient() {
  const t = useTranslations("Exercises");
  const { items, total, isLoading, error, createExercise, updateExercise, deleteExercise } =
    useExercises();
  const [activeFilter, setActiveFilter] = useState("All");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (activeFilter === "All") return items;
    return items.filter(
      (item) => item.muscle_group?.toLowerCase() === activeFilter.toLowerCase(),
    );
  }, [items, activeFilter]);

  const handleCreate = async () => {
    setFormError(null);
    if (!draft.name.trim()) {
      setFormError(t("errors.nameRequired"));
      return;
    }

    try {
      setPendingId("create");
      await createExercise({
        name: draft.name.trim(),
        muscle_group: draft.muscle_group.trim() || undefined,
        exercise_type: draft.exercise_type.trim() || undefined,
      });
      setDraft(emptyDraft);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t("errors.createFailed"),
      );
    } finally {
      setPendingId(null);
    }
  };

  const startEdit = (exercise: Exercise) => {
    setEditId(exercise.id);
    setEditDraft({
      name: exercise.name ?? "",
      muscle_group: exercise.muscle_group ?? "",
      exercise_type: exercise.exercise_type ?? "",
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditDraft(emptyDraft);
  };

  const handleSave = async (id: string) => {
    setFormError(null);
    if (!editDraft.name.trim()) {
      setFormError(t("errors.nameRequired"));
      return;
    }
    try {
      setPendingId(id);
      await updateExercise(id, {
        name: editDraft.name.trim(),
        muscle_group: editDraft.muscle_group.trim() || undefined,
        exercise_type: editDraft.exercise_type.trim() || undefined,
      });
      cancelEdit();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t("errors.updateFailed"),
      );
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setFormError(null);
    try {
      setPendingId(id);
      await deleteExercise(id);
      if (editId === id) cancelEdit();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t("errors.deleteFailed"),
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="mt-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => {
              const isActive = filter.value === activeFilter;
              return (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`h-12 border-2 px-5 text-lg font-bold uppercase tracking-widest transition-colors duration-200 ${
                    isActive
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(filter.labelKey)}
                </button>
              );
            })}
          </div>

          <div className="mt-10">
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="py-10 text-base font-bold uppercase tracking-widest text-muted-foreground">
                  {t("loading")}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-10 text-base font-bold uppercase tracking-widest text-muted-foreground">
                  {t("empty")}
                </div>
              ) : (
                filteredItems.map((exercise) => {
                  const isEditing = editId === exercise.id;
                  return (
                    <div
                      key={exercise.id}
                      className="grid grid-cols-[minmax(0,2fr)_140px_180px_minmax(0,200px)] items-center gap-6 border border-border bg-background px-6 py-6"
                    >
                      <div className="text-lg font-bold uppercase tracking-tight text-foreground">
                        {isEditing ? (
                          <input
                            value={editDraft.name}
                            onChange={(event) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                name: event.target.value,
                              }))
                            }
                            className="h-10 w-full border-2 border-border bg-transparent px-3 text-lg font-bold uppercase tracking-widest text-foreground focus:border-accent focus:outline-none"
                          />
                        ) : (
                          exercise.name
                        )}
                      </div>
                      <div>
                        {isEditing ? (
                          <select
                            value={editDraft.muscle_group}
                            onChange={(event) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                muscle_group: event.target.value,
                              }))
                            }
                            className="h-10 w-full border-2 border-border bg-background px-3 text-lg font-semibold uppercase tracking-widest text-foreground focus:border-accent focus:outline-none"
                          >
                            <option value="">{t("select")}</option>
                            {muscleGroups.map((group) => (
                              <option key={group.value} value={group.value}>
                                {t(group.labelKey)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex w-fit border border-accent bg-background px-3 py-1 text-base font-bold uppercase tracking-widest text-accent">
                            {exercise.muscle_group
                              ? (() => {
                                  const labelKey = filters.find(
                                    (filter) =>
                                      filter.value === exercise.muscle_group,
                                  )?.labelKey;
                                  return labelKey ? t(labelKey) : t("emptyValue");
                                })()
                              : t("emptyValue")}
                          </span>
                        )}
                      </div>
                      <div className="text-base font-bold uppercase tracking-widest text-muted-foreground">
                        {isEditing ? (
                          <select
                            value={editDraft.exercise_type}
                            onChange={(event) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                exercise_type: event.target.value,
                              }))
                            }
                            className="h-10 w-full border-2 border-border bg-background px-3 text-lg font-semibold uppercase tracking-widest text-foreground focus:border-accent focus:outline-none"
                          >
                            <option value="">{t("select")}</option>
                            {exerciseTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {t(type.labelKey)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          exercise.exercise_type
                            ? (() => {
                                const labelKey = exerciseTypes.find(
                                  (type) => type.value === exercise.exercise_type,
                                )?.labelKey;
                                return labelKey ? t(labelKey) : t("emptyValue");
                              })()
                            : t("emptyValue")
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSave(exercise.id)}
                              className="h-10 border-2 border-accent bg-accent px-3 text-base font-bold uppercase tracking-widest text-accent-foreground"
                              disabled={pendingId === exercise.id}
                            >
                              {t("save")}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="h-10 border-2 border-border px-3 text-base font-bold uppercase tracking-widest text-foreground"
                            >
                              {t("cancel")}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(exercise)}
                              className="h-10 border-2 border-border px-3 text-base font-bold uppercase tracking-widest text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background"
                            >
                              {t("edit")}
                            </button>
                            <button
                              onClick={() => handleDelete(exercise.id)}
                              className="h-10 border-2 border-border px-3 text-base font-bold uppercase tracking-widest text-foreground transition-colors duration-200 hover:border-red-500 hover:text-red-500"
                              disabled={pendingId === exercise.id}
                            >
                              {t("delete")}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6 border-l border-border pl-8">
          <div>
            <div className="text-base font-bold uppercase tracking-widest text-accent">
              {t("addExercise")}
            </div>
            <p className="mt-2 text-lg font-medium text-muted-foreground">
              {t("addExerciseNote")}
            </p>
          </div>

          <div className="space-y-4 border-2 border-border bg-background p-6">
            <div>
              <label className="text-base font-bold uppercase tracking-widest text-muted-foreground">
                {t("name")}
              </label>
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder={t("placeholders.name")}
                className="mt-2 h-10 w-full border-2 border-border bg-transparent px-3 text-lg font-semibold uppercase tracking-widest text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-base font-bold uppercase tracking-widest text-muted-foreground">
                {t("muscleGroup")}
              </label>
              <select
                value={draft.muscle_group}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    muscle_group: event.target.value,
                  }))
                }
                className="mt-2 h-10 w-full border-2 border-border bg-background px-3 text-lg font-semibold
                uppercase tracking-widest text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">{t("select")}</option>
                {muscleGroups.map((group) => (
                  <option key={group.value} value={group.value}>
                    {t(group.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-base font-bold uppercase tracking-widest text-muted-foreground">
                {t("exerciseType")}
              </label>
              <select
                value={draft.exercise_type}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    exercise_type: event.target.value,
                  }))
                }
                className="mt-2 h-10 w-full border-2 border-border bg-background px-3 text-lg font-semibold uppercase
                tracking-widest text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">{t("select")}</option>
                {exerciseTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {t(type.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            {formError ? (
              <div className="text-base font-bold uppercase tracking-widest text-red-400">
                {formError}
              </div>
            ) : null}
            {error ? (
              <div className="text-base font-bold uppercase tracking-widest text-red-400">
                {error}
              </div>
            ) : null}
            <button
              onClick={handleCreate}
              className="mt-2 inline-flex h-12 items-center justify-center border-2 border-accent bg-accent px-5 text-lg font-bold uppercase tracking-widest text-accent-foreground transition-transform duration-200 hover:scale-[1.02]"
              disabled={pendingId === "create"}
            >
              {t("createExercise")}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
