import AppShell from "../components/AppShell";
import AddExerciseButton from "./AddExerciseButton";
import ExercisesClient from "./ExercisesClient";
import { getTranslations } from "next-intl/server";

export default async function ExercisesPage() {
  const t = await getTranslations("Exercises");

  return (
    <AppShell>
      <ExercisesClient>
        <section className="border-b border-border pb-8 flex flex-row w-full items-center justify-between gap-6">
          <h1 className="text-[clamp(3rem,10vw,8rem)] font-bold uppercase leading-[0.85] tracking-tighter">
            {t("title")}
          </h1>
          <AddExerciseButton />
        </section>
      </ExercisesClient>
    </AppShell>
  );
}
