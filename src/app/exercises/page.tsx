import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import AddExerciseButton from "./AddExerciseButton";
import ExercisesClient from "./ExercisesClient";
import { getTranslations } from "next-intl/server";

export default async function ExercisesPage() {
  const t = await getTranslations("Exercises");

  return (
    <AppShell>
      <ExercisesClient>
        <PageHeader title={t("title")} actions={<AddExerciseButton />} />
      </ExercisesClient>
    </AppShell>
  );
}
