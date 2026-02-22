import Link from "next/link";
import { notFound } from "next/navigation";

import AppShell from "../../../components/AppShell";
import { pbGetOne, pbList } from "@/lib/pocketbase";
import { WeekTabs } from "./WeekTabs";

type StudentRecord = {
  id: string;
  name: string;
};

type ExerciseCompletionRecord = {
  id: string;
  student_id: string;
  routine_exercise_id: string;
  completed_at: string;
  week_key: string;
  status: "completed" | "skipped";
  sets?: number;
  reps?: string;
  weight?: number;
  expand?: {
    routine_exercise_id?: {
      id: string;
      day_index: number;
      expand?: {
        exercise_id?: {
          id: string;
          name: string;
          muscle_group?: string;
        };
      };
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

  const [student, completionsResult] = await Promise.all([
    pbGetOne<StudentRecord>("students", slug),
    pbList<ExerciseCompletionRecord>("exercise_completions", {
      filter: `student_id="${slug}"`,
      expand: "routine_exercise_id.exercise_id",
      perPage: 200,
      sort: "-week_key,-completed_at",
    }),
  ]);

  if (!student) {
    notFound();
  }

  const completions = completionsResult.items;

  // Group by week
  const byWeek = completions.reduce(
    (acc, c) => {
      const week = c.week_key || "Unknown";
      if (!acc[week]) acc[week] = [];
      acc[week].push(c);
      return acc;
    },
    {} as Record<string, ExerciseCompletionRecord[]>,
  );

  const weeks = Object.keys(byWeek).sort((a, b) => b.localeCompare(a));

  // Transform for client component
  const weekData = weeks.map((week) => ({
    week,
    entries: byWeek[week].map((entry) => ({
      id: entry.id,
      exerciseName:
        entry.expand?.routine_exercise_id?.expand?.exercise_id?.name ??
        "Unknown",
      muscleGroup:
        entry.expand?.routine_exercise_id?.expand?.exercise_id?.muscle_group,
      sets: entry.sets,
      reps: entry.reps,
      weight: entry.weight,
      status: entry.status,
    })),
  }));

  return (
    <AppShell>
      <section className="border-b border-border pb-6">
        <Link
          href={`/students/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors duration-150 hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          Back to profile
        </Link>
        <h1 className="mt-6 text-2xl font-semibold uppercase leading-tight tracking-tight md:text-3xl">
          {student.name}
        </h1>
      </section>

      {weeks.length === 0 ? (
        <section className="mt-10 border border-dashed border-border bg-background-card p-8 rounded-lg">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
            No records yet
          </div>
          <div className="mt-4 text-xl font-semibold text-foreground">
            This student hasn&apos;t logged any exercises.
          </div>
        </section>
      ) : (
        <WeekTabs data={weekData} />
      )}
    </AppShell>
  );
}
