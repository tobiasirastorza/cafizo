import Link from "next/link";
import { notFound } from "next/navigation";

import AppShell from "../../../components/AppShell";
import { pbGetOne, pbList } from "@/lib/pocketbase";

type StudentRecord = {
  id: string;
  name: string;
};

type RoutineRecord = {
  id: string;
  name: string;
  level?: string;
  split?: string;
  days_per_week?: number;
};

type StudentRoutineRecord = {
  id: string;
  routine_id: string;
  status?: string;
  expand?: {
    routine_id?: RoutineRecord;
  };
};

type RoutineExerciseRecord = {
  id: string;
  routine_id: string;
  order_index: number;
  sets?: string;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
  expand?: {
    exercise_id?: {
      id: string;
      name: string;
      muscle_group?: string;
      exercise_type?: string;
    };
  };
};

type StudentWorkoutsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function StudentWorkoutsPage({
  params,
}: StudentWorkoutsPageProps) {
  const { slug } = await params;

  const [student, activeRoutineResult] = await Promise.all([
    pbGetOne<StudentRecord>("students", slug),
    pbList<StudentRoutineRecord>("student_routines", {
      filter: `student_id=\"${slug}\" && status=\"active\"`,
      expand: "routine_id",
      perPage: 1,
    }),
  ]);

  if (!student) {
    notFound();
  }

  const activeAssignment = activeRoutineResult.items[0];
  const routine = activeAssignment?.expand?.routine_id;

  if (!routine) {
    return (
      <AppShell>
        <section className="border-b border-border pb-10">
          <Link
            href={`/students/${slug}`}
            className="inline-flex items-center gap-2 text-lg font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">←</span>
            Back to profile
          </Link>
          <h1 className="mt-6 text-[clamp(3rem,10vw,8rem)] font-bold uppercase leading-[0.85] tracking-tighter">
            {student.name}
          </h1>
        </section>

        <section className="mt-10 border-2 border-dashed border-border p-8">
          <div className="text-base font-bold uppercase tracking-widest text-muted-foreground">
            No active routine
          </div>
          <div className="mt-4 text-2xl font-bold uppercase tracking-tight text-foreground">
            Assign a routine to view workouts.
          </div>
        </section>
      </AppShell>
    );
  }

  const exercisesResult = await pbList<RoutineExerciseRecord>(
    "routine_exercises",
    {
      filter: `routine_id=\"${routine.id}\"`,
      expand: "exercise_id",
      perPage: 200,
      sort: "order_index",
    },
  );

  const exercises = exercisesResult.items;

  return (
    <AppShell>
      <section className="border-b border-border pb-10">
        <Link
          href={`/students/${slug}`}
          className="inline-flex items-center gap-2 text-lg font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          Back to profile
        </Link>
        <h1 className="mt-6 text-[clamp(3rem,10vw,8rem)] font-bold uppercase leading-[0.85] tracking-tighter">
          {student.name}
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-base font-bold uppercase tracking-widest text-muted-foreground">
          <span className="text-accent">{routine.name}</span>
          <span>•</span>
          <span>{routine.level ?? "level unset"}</span>
          <span>•</span>
          <span>{routine.split ?? "split unset"}</span>
        </div>
      </section>

      <section className="mt-10 space-y-10">
        <div className="border-2 border-border bg-background p-6">
          <div className="text-lg font-bold uppercase tracking-tight text-foreground">
            Workout
          </div>
          <div className="mt-4 grid gap-4">
            {exercises.map((entry) => (
              <div
                key={entry.id}
                className="grid gap-4 border border-border p-4 md:grid-cols-[minmax(0,2fr)_110px_110px_120px_1fr]"
              >
                <div>
                  <div className="text-base font-bold uppercase tracking-widest text-muted-foreground">
                    Exercise
                  </div>
                  <div className="mt-2 text-lg font-bold uppercase tracking-tight text-foreground">
                    {entry.expand?.exercise_id?.name ?? "Exercise"}
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold uppercase tracking-widest text-muted-foreground">
                    Sets
                  </div>
                  <div className="mt-2 text-base font-bold uppercase tracking-widest text-foreground">
                    {entry.sets ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold uppercase tracking-widest text-muted-foreground">
                    Reps
                  </div>
                  <div className="mt-2 text-base font-bold uppercase tracking-widest text-foreground">
                    {entry.reps ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold uppercase tracking-widest text-muted-foreground">
                    Rest
                  </div>
                  <div className="mt-2 text-base font-bold uppercase tracking-widest text-foreground">
                    {entry.rest_seconds ? `${entry.rest_seconds}s` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-base font-bold uppercase tracking-widest text-muted-foreground">
                    Notes
                  </div>
                  <div className="mt-2 text-base font-bold uppercase tracking-widest text-foreground">
                    {entry.notes ?? "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
