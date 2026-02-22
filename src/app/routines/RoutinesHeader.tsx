"use client";

import { useTranslations } from "next-intl";
import CreateRoutineModal from "./CreateRoutineModal";

type ExerciseOption = {
  id: string;
  name: string;
  muscle_group?: string;
};

type RoutinesHeaderProps = {
  exercises: ExerciseOption[];
};

export default function RoutinesHeader({ exercises }: RoutinesHeaderProps) {
  const t = useTranslations("Routines");

  return (
    <section className="border-b border-border pb-6">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <h1 className="text-2xl font-semibold uppercase leading-tight tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <CreateRoutineModal exercises={exercises} />
      </div>
    </section>
  );
}
