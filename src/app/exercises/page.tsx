import AppShell from "../components/AppShell";
import AddExerciseButton from "./AddExerciseButton";
import ExercisesClient from "./ExercisesClient";
import { getTranslations } from "next-intl/server";

export default async function ExercisesPage() {
  const t = await getTranslations("Exercises");

  return (
    <AppShell>
      <ExercisesClient>
        <section className="border-b border-border pb-6 flex flex-row w-full items-center justify-between gap-6">
          <h1 className="text-2xl font-semibold uppercase leading-tight tracking-tight md:text-3xl">
            {t("title")}
          </h1>
          <AddExerciseButton />
        </section>
      </ExercisesClient>
    </AppShell>
  );
}
