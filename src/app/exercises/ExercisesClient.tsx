"use client";

import { createContext, useMemo, useState } from "react";

import useExercises, { Exercise } from "@/hooks/useExercises";
import { useTranslations } from "next-intl";

export const ExercisesModalContext = createContext<(() => void) | null>(null);

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

export default function ExercisesClient({
  children,
}: {
  children?: React.ReactNode;
}) {
  const t = useTranslations("Exercises");
  const { items, isLoading, error, createExercise, updateExercise, deleteExercise } =
    useExercises();
  const [activeFilter, setActiveFilter] = useState("All");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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
      setShowModal(false);
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

  const openModal = () => {
    setDraft(emptyDraft);
    setFormError(null);
    setShowModal(true);
  };

  return (
    <ExercisesModalContext.Provider value={openModal}>
      {children}
      <section className="mt-8">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = filter.value === activeFilter;
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`h-10 border px-4 text-sm font-medium uppercase tracking-[0.08em] transition-colors duration-150 rounded-md ${
                  isActive
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background-card text-foreground-secondary hover:bg-background-muted hover:text-foreground"
                }`}
              >
                {t(filter.labelKey)}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
        <div className="flex flex-col border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="py-10 text-sm text-foreground-secondary text-center">
              {t("loading")}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-10 text-sm text-foreground-secondary text-center">
              {t("empty")}
            </div>
          ) : (
            filteredItems.map((exercise, idx) => {
              const isEditing = editId === exercise.id;
              return (
                <div
                  key={exercise.id}
                  className={`flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between border-b last:border-b-0 border-border ${idx % 2 === 1 ? "bg-background-muted/30" : "bg-background-card"}`}
                >
                  <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-4">
                    <div className="min-w-[200px] text-base font-medium text-foreground">
                      {isEditing ? (
                        <input
                          value={editDraft.name}
                          onChange={(event) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                          className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground focus:border-ring focus:outline-none rounded-md"
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
                          className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground focus:border-ring focus:outline-none rounded-md"
                        >
                          <option value="">{t("select")}</option>
                          {muscleGroups.map((group) => (
                            <option key={group.value} value={group.value}>
                              {t(group.labelKey)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex w-fit border border-accent bg-accent-light px-2 py-1 text-xs font-medium uppercase tracking-[0.08em] text-accent rounded">
                          {exercise.muscle_group
                            ? (() => {
                                const labelKey = filters.find(
                                  (filter) =>
                                    filter.value.toLowerCase() === exercise.muscle_group?.toLowerCase(),
                                )?.labelKey;
                                return labelKey ? t(labelKey) : exercise.muscle_group;
                              })()
                            : t("emptyValue")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-foreground-secondary">
                      {isEditing ? (
                        <select
                          value={editDraft.exercise_type}
                          onChange={(event) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              exercise_type: event.target.value,
                            }))
                          }
                          className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground focus:border-ring focus:outline-none rounded-md"
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
                                (type) => type.value.toLowerCase() === exercise.exercise_type?.toLowerCase(),
                              )?.labelKey;
                              return labelKey ? t(labelKey) : exercise.exercise_type;
                            })()
                          : t("emptyValue")
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(exercise.id)}
                          className="h-10 border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90"
                          disabled={pendingId === exercise.id}
                        >
                          {t("save")}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="h-10 border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                        >
                          {t("cancel")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(exercise)}
                          className="h-10 border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                        >
                          {t("edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(exercise.id)}
                          className="h-10 border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:border-red-600 hover:text-red-600"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="w-full max-w-md border border-border bg-background-card p-8 shadow-md rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {t("addExercise")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl font-medium text-foreground-muted hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                  {t("name")}
                </label>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder={t("placeholders.name")}
                  className="mt-2 h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-ring focus:outline-none rounded-md"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
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
                  className="mt-2 h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground focus:border-ring focus:outline-none rounded-md"
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
                <label className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
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
                  className="mt-2 h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground focus:border-ring focus:outline-none rounded-md"
                >
                  <option value="">{t("select")}</option>
                  {exerciseTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {t(type.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              {formError && (
                <div className="text-xs text-red-600">
                  {formError}
                </div>
              )}
              {error && (
                <div className="text-xs text-red-600">
                  {error}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 h-10 border border-accent bg-accent text-sm font-medium text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90"
                  disabled={pendingId === "create"}
                >
                  {t("createExercise")}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="h-10 border border-border bg-background-card px-5 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </section>
    </ExercisesModalContext.Provider>
  );
}
