"use client";

import { createContext, useMemo, useState } from "react";
import { toast } from "sonner";
import useExercises, { Exercise } from "@/hooks/useExercises";

type Draft = {
  name: string;
  muscle_group: string;
  exercise_type: string;
};

function emptyDraft(): Draft {
  return { name: "", muscle_group: "", exercise_type: "" };
}

export const ExercisesModalContext = createContext<(() => void) | null>(null);

export function useExercisesManager(t: (key: string) => string) {
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
      setDraft(emptyDraft());
      setShowModal(false);
      toast.success(t("actions.created"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.createFailed");
      setFormError(message);
      toast.error(message);
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
    setEditDraft(emptyDraft());
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
      toast.success(t("actions.updated"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.updateFailed");
      setFormError(message);
      toast.error(message);
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
      toast.success(t("actions.deleted"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.deleteFailed");
      setFormError(message);
      toast.error(message);
    } finally {
      setPendingId(null);
    }
  };

  const openModal = () => {
    setDraft(emptyDraft());
    setFormError(null);
    setShowModal(true);
  };

  return {
    items,
    isLoading,
    error,
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
    handleCreate,
    startEdit,
    cancelEdit,
    handleSave,
    handleDelete,
    openModal,
  };
}
