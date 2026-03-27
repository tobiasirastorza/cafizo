"use client";

import { useTranslations } from "next-intl";
import CreateRoutineModal from "./CreateRoutineModal";
import PageHeader from "../components/PageHeader";

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
    <PageHeader title={t("title")} actions={<CreateRoutineModal exercises={exercises} />} />
  );
}
