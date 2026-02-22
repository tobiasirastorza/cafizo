"use client";

import { useTranslations } from "next-intl";
import { useExercisesModalContext } from "./ExercisesClient";

export default function AddExerciseButton() {
  const t = useTranslations("Exercises");
  const openModal = useExercisesModalContext();
  if (!openModal) return null;
  return (
    <button
      onClick={openModal}
      className="flex h-10 items-center gap-2 border border-accent bg-accent px-4 text-sm font-medium uppercase tracking-[0.08em] text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90"
    >
      <span className="text-base">+</span>
      {t("addExercise")}
    </button>
  );
}
