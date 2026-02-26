import AppShell from "../components/AppShell";
import { pbList } from "@/lib/pocketbase";
import { RoutineCard } from "./RoutineCard";
import RoutinesHeader from "./RoutinesHeader";

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

type ExerciseOption = {
  id: string;
  name: string;
  muscle_group?: string;
};

type RoutineExerciseRecord = {
  id: string;
  routine_id: string;
  exercise_id: string;
  day_index: number;
  day_label?: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds?: number;
  notes?: string;
  expand?: {
    exercise_id?: ExerciseRecord;
  };
};

export default async function RoutinesPage() {
  const [routinesResult, routineExercisesResult, exercisesResult] = await Promise.all([
    pbList<RoutineRecord>("routines", { perPage: 50 }),
    pbList<RoutineExerciseRecord>("routine_exercises", {
      perPage: 200,
      expand: "exercise_id",
      sort: "routine_id,day_index,order_index",
    }),
    pbList<ExerciseOption>("exercises", {
      perPage: 200,
      sort: "name",
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
          exercise_id: ex.exercise_id,
          name: ex.expand?.exercise_id?.name ?? "Unknown",
          muscle_group: ex.expand?.exercise_id?.muscle_group ?? "",
          exercise_type: ex.expand?.exercise_id?.exercise_type ?? "",
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
        });
        return acc;
      },
      {} as Record<
        number,
        {
          id: string;
          exercise_id: string;
          name: string;
          muscle_group: string;
          exercise_type: string;
          sets: number;
          reps: string;
          rest_seconds?: number;
          notes?: string;
        }[]
      >,
    );
    const dayLabels = exercises.reduce(
      (acc, ex) => {
        if (!acc[ex.day_index] && ex.day_label?.trim()) {
          acc[ex.day_index] = ex.day_label.trim();
        }
        return acc;
      },
      {} as Record<number, string>,
    );

    return {
      id: routine.id,
      name: routine.name,
      level: routine.level,
      split: routine.split,
      days_per_week: routine.days_per_week,
      exercisesByDay: byDay,
      dayLabels,
    };
  });

  return (
    <AppShell>
      <RoutinesHeader exercises={exercisesResult.items} />

      <section className="mt-8 flex flex-col">
        <div className="divide-y divide-border">
          {routineData.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} exercises={exercisesResult.items} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
