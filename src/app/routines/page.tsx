import AppShell from "../components/AppShell";
import { getTranslations } from "next-intl/server";
import { pbList } from "@/lib/pocketbase";
import { RoutineCard } from "./RoutineCard";

type ExerciseRecord = {
  id: string;
  name: string;
  muscle_group: string;
  exercise_type: string;
};

type RoutineRecord = {
  id: string;
  name: string;
  level: string;
  split: string;
  days_per_week: number;
};

type RoutineExerciseRecord = {
  id: string;
  routine_id: string;
  exercise_id: string;
  day_index: number;
  sets: number;
  reps: string;
  expand?: {
    exercise_id?: ExerciseRecord;
  };
};

export default async function RoutinesPage() {
  const t = await getTranslations("Routines");

  const [routinesResult, routineExercisesResult] = await Promise.all([
    pbList<RoutineRecord>("routines", { perPage: 50 }),
    pbList<RoutineExerciseRecord>("routine_exercises", {
      perPage: 200,
      expand: "exercise_id",
      sort: "routine_id,day_index,order_index",
    }),
  ]);

  const routines = routinesResult.items;
  const routineExercises = routineExercisesResult.items;

  // Group exercises by routine
  const exercisesByRoutine = routineExercises.reduce(
    (acc, re) => {
      if (!acc[re.routine_id]) acc[re.routine_id] = [];
      acc[re.routine_id].push(re);
      return acc;
    },
    {} as Record<string, RoutineExerciseRecord[]>,
  );

  // Transform data for client component
  const routineData = routines.map((routine) => {
    const exercises = exercisesByRoutine[routine.id] ?? [];
    const byDay = exercises.reduce(
      (acc, ex) => {
        if (!acc[ex.day_index]) acc[ex.day_index] = [];
        acc[ex.day_index].push({
          id: ex.id,
          name: ex.expand?.exercise_id?.name ?? "Unknown",
          muscle_group: ex.expand?.exercise_id?.muscle_group ?? "",
          exercise_type: ex.expand?.exercise_id?.exercise_type ?? "",
          sets: ex.sets,
          reps: ex.reps,
        });
        return acc;
      },
      {} as Record<number, { id: string; name: string; muscle_group: string; exercise_type: string; sets: number; reps: string }[]>,
    );

    return {
      id: routine.id,
      name: routine.name,
      level: routine.level,
      split: routine.split,
      days_per_week: routine.days_per_week,
      exercisesByDay: byDay,
    };
  });

  return (
    <AppShell>
      <section className="border-b border-border pb-6">
        <div className="mt-4 flex flex-wrap items-center justify-between gap-6">
          <h1 className="text-[clamp(3rem,10vw,8rem)] font-bold uppercase leading-[0.85] tracking-tighter">
            {t("title")}
          </h1>
          <button className="flex h-14 items-center gap-3 border-2 border-accent bg-accent px-6 text-lg font-bold uppercase tracking-widest text-accent-foreground transition-transform duration-200 hover:scale-[1.02]">
            <span className="text-lg">+</span>
            {t("actions.create")}
          </button>
        </div>
      </section>

      <section className="mt-8 flex flex-col">
        <div className="divide-y divide-border">
          {routineData.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
