"use client";

import { type ReactNode, useContext, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiSaveLine,
} from "@remixicon/react";

import { useExercisesManager, ExercisesModalContext } from "@/hooks/useExercisesManager";

const filters = [
  { value: "All", labelKey: "filters.all" },
  { value: "Legs", labelKey: "filters.legs" },
  { value: "Quadriceps", labelKey: "filters.quadriceps" },
  { value: "Hamstrings", labelKey: "filters.hamstrings" },
  { value: "Glutes", labelKey: "filters.glutes" },
  { value: "Calves", labelKey: "filters.calves" },
  { value: "Back", labelKey: "filters.back" },
  { value: "Chest", labelKey: "filters.chest" },
  { value: "Shoulders", labelKey: "filters.shoulders" },
  { value: "Biceps", labelKey: "filters.biceps" },
  { value: "Triceps", labelKey: "filters.triceps" },
  { value: "Core", labelKey: "filters.core" },
];
const muscleGroups = filters.filter((item) => item.value !== "All");
const exerciseTypes = [{ value: "Hypertrophy", labelKey: "types.hypertrophy" }];

function ActionIconButton({
  label,
  icon,
  onClick,
  disabled = false,
  tone = "neutral",
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "accent" | "danger";
}) {
  const toneClasses =
    tone === "accent"
      ? "border-accent bg-accent text-accent-foreground hover:bg-accent/90"
      : tone === "danger"
        ? "border-border bg-background-card text-foreground hover:border-red-600 hover:text-red-600"
        : "border-border bg-background-card text-foreground hover:bg-background-muted";

  return (
    <div className="group relative">
      <span className="pointer-events-none absolute -top-11 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background shadow-sm group-hover:block group-focus-within:block">
        {label}
        <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-foreground" />
      </span>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-md border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60 ${toneClasses}`}
      >
        {icon}
      </button>
    </div>
  );
}

export default function ExercisesClient({ children }: { children?: React.ReactNode }) {
  const t = useTranslations("Exercises");
  const [query, setQuery] = useState("");
  const {
    activeFilter,
    setActiveFilter,
    draft,
    setDraft,
    editId,
    editDraft,
    setEditDraft,
    pendingId,
    formError,
    showModal,
    setShowModal,
    filteredItems,
    isLoading,
    error,
    handleCreate,
    startEdit,
    cancelEdit,
    handleSave,
    handleDelete,
    openModal,
  } = useExercisesManager(t);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return filteredItems;
    return filteredItems.filter((exercise) =>
      exercise.name.toLowerCase().includes(normalized),
    );
  }, [filteredItems, query]);

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

        <div className="mt-4 max-w-md">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search.placeholder")}
            className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
          />
        </div>

        <div className="mt-6">
          <div className="flex flex-col border border-border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="py-10 text-sm text-foreground-secondary text-center">{t("loading")}</div>
            ) : visibleItems.length === 0 ? (
              <div className="py-10 text-sm text-foreground-secondary text-center">
                {query.trim() ? t("search.empty") : t("empty")}
              </div>
            ) : (
              visibleItems.map((exercise, idx) => {
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
                              setEditDraft((prev) => ({ ...prev, name: event.target.value }))
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
                              setEditDraft((prev) => ({ ...prev, muscle_group: event.target.value }))
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
                                      filter.value.toLowerCase() ===
                                      exercise.muscle_group?.toLowerCase(),
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
                              setEditDraft((prev) => ({ ...prev, exercise_type: event.target.value }))
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
                        ) : exercise.exercise_type ? (
                          (() => {
                            const labelKey = exerciseTypes.find(
                              (type) =>
                                type.value.toLowerCase() ===
                                exercise.exercise_type?.toLowerCase(),
                            )?.labelKey;
                            return labelKey ? t(labelKey) : exercise.exercise_type;
                          })()
                        ) : (
                          t("emptyValue")
                        )}
                      </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:justify-end">
                      {isEditing ? (
                        <>
                          <ActionIconButton
                            label={t("save")}
                            icon={<RiSaveLine size={18} aria-hidden="true" />}
                            onClick={() => handleSave(exercise.id)}
                            disabled={pendingId === exercise.id}
                            tone="accent"
                          />
                          <ActionIconButton
                            label={t("cancel")}
                            icon={<RiCloseLine size={18} aria-hidden="true" />}
                            onClick={cancelEdit}
                          />
                        </>
                      ) : (
                        <>
                          <ActionIconButton
                            label={t("edit")}
                            icon={<RiEditLine size={18} aria-hidden="true" />}
                            onClick={() => startEdit(exercise)}
                          />
                          <ActionIconButton
                            label={t("delete")}
                            icon={<RiDeleteBinLine size={18} aria-hidden="true" />}
                            onClick={() => handleDelete(exercise.id)}
                            disabled={pendingId === exercise.id}
                            tone="danger"
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
            <div className="w-full max-w-md border border-border bg-background-card p-8 shadow-md rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">{t("addExercise")}</h2>
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
                    onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
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
                      setDraft((prev) => ({ ...prev, muscle_group: event.target.value }))
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
                      setDraft((prev) => ({ ...prev, exercise_type: event.target.value }))
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
                {formError && <div className="text-xs text-red-600">{formError}</div>}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="h-10 border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={pendingId === "create"}
                  className="h-10 border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90 disabled:opacity-60"
                >
                  {t("createExercise")}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </ExercisesModalContext.Provider>
  );
}

export function useExercisesModalContext() {
  return useContext(ExercisesModalContext);
}
