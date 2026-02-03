"use client";

import { useContext } from "react";
import { useTranslations } from "next-intl";
import { ExercisesModalContext } from "./ExercisesClient";

export default function AddExerciseButton() {
  const t = useTranslations("Exercises");
  const openModal = useContext(ExercisesModalContext);
  if (!openModal) return null;
  return (
    <button
      onClick={openModal}
      className="flex h-14 items-center gap-2 border-2 border-accent bg-accent px-5 text-lg font-bold uppercase tracking-widest text-accent-foreground transition-transform duration-200 hover:scale-[1.02]"
    >
      <span className="text-lg">+</span>
      {t("addExercise")}
    </button>
  );
}
