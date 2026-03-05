import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import AppShell from "../../../components/AppShell";
import { pbGetOne, pbList } from "@/lib/pocketbase";
import { formatWeekKeyLabel } from "@/lib/date-format";
import { getBusinessWeekKey } from "@/lib/business-time";
import { WeekTabs } from "./WeekTabs";
import WorkoutsTrackerClient from "./WorkoutsTrackerClient";

type StudentRecord = {
  id: string;
  name: string;
  status?: string;
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

type StudentRoutineRecord = {
  id: string;
  student_id: string;
  routine_id: string;
  status: string;
  expand?: {
    routine_id?: {
      id: string;
      name: string;
      mode?: "weekly" | "free";
    };
  };
};

type RoutineExerciseRecord = {
  id: string;
  routine_id: string;
  day_index: number;
  day_label?: string;
  sets?: string;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
  order_index?: number;
  expand?: {
    exercise_id?: {
      id: string;
      name: string;
      muscle_group?: string;
    };
  };
};

type StudentWorkoutsPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function StudentWorkoutsPage({
  params,
  searchParams,
}: StudentWorkoutsPageProps) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const t = await getTranslations("Workouts");
  const locale = await getLocale();
  const currentWeekKey = getBusinessWeekKey();
  const activeTab = tab === "history" ? "history" : "current";

  const [student, completionsResult, activeRoutineResult] = await Promise.all([
    pbGetOne<StudentRecord>("students", slug),
    pbList<ExerciseCompletionRecord>("exercise_completions", {
      filter: `student_id="${slug}"`,
      expand: "routine_exercise_id.exercise_id",
      perPage: 200,
      sort: "-week_key,-completed_at",
    }),
    pbList<StudentRoutineRecord>("student_routines", {
      filter: `student_id="${slug}" && status="active"`,
      perPage: 1,
      expand: "routine_id",
    }),
  ]);

  if (!student) {
    notFound();
  }

  if ((student.status ?? "").toLowerCase() === "inactive") {
    notFound();
  }

  const completions = completionsResult.items;
  const activeRoutine = activeRoutineResult.items[0]?.expand?.routine_id ?? null;
  const routineMode = activeRoutine?.mode ?? "weekly";
  const routineExercisesResult = activeRoutine
    ? await pbList<RoutineExerciseRecord>("routine_exercises", {
        filter: `routine_id="${activeRoutine.id}"`,
        expand: "exercise_id",
        perPage: 200,
        sort: "day_index,order_index",
      })
    : { items: [] as RoutineExerciseRecord[] };

  const currentWeekCompletions = completions.filter(
    (completion) => completion.week_key === currentWeekKey,
  );
  const completionScope =
    routineMode === "free" ? completions : currentWeekCompletions;
  const latestByRoutineExercise = completionScope.reduce(
    (acc, completion) => {
      const existing = acc[completion.routine_exercise_id];
      if (!existing) {
        acc[completion.routine_exercise_id] = completion;
        return acc;
      }
      const current = new Date(completion.completed_at).getTime();
      const previous = new Date(existing.completed_at).getTime();
      if (current > previous) {
        acc[completion.routine_exercise_id] = completion;
      }
      return acc;
    },
    {} as Record<string, ExerciseCompletionRecord>,
  );

  const activeEntries = routineExercisesResult.items.map((entry) => {
    const completion = latestByRoutineExercise[entry.id];
    return {
      routineExerciseId: entry.id,
      dayIndex: entry.day_index,
      dayLabel: entry.day_label || `Day ${entry.day_index}`,
      orderIndex: entry.order_index ?? 0,
      lastCompletionId: completion?.id,
      exerciseName: entry.expand?.exercise_id?.name ?? t("unknownExercise"),
      muscleGroup: entry.expand?.exercise_id?.muscle_group ?? "",
      targetSets: entry.sets,
      targetReps: entry.reps,
      lastStatus: completion?.status ?? null,
      lastSets: completion?.sets,
      lastReps: completion?.reps,
      lastWeight: completion?.weight,
      lastCompletedAt: completion?.completed_at,
    };
  });

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
  const weekData = weeks.map((weekKey) => ({
    weekKey,
    weekLabel: formatWeekKeyLabel(weekKey, locale),
    entries: byWeek[weekKey].map((entry) => ({
      id: entry.id,
      exerciseName:
        entry.expand?.routine_exercise_id?.expand?.exercise_id?.name ??
        t("unknownExercise"),
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
          {t("backToProfile")}
        </Link>
        <h1 className="mt-6 text-2xl font-semibold uppercase leading-tight tracking-tight md:text-3xl">
          {student.name}
        </h1>
      </section>

      <section className="mt-6">
        <div className="inline-flex w-full rounded-md border border-border bg-background-card p-1 md:w-auto">
          <Link
            href={`/students/${slug}/workouts?tab=current`}
            className={`flex-1 rounded px-3 py-2 text-xs font-medium uppercase tracking-[0.08em] transition-all duration-150 md:flex-none ${
              activeTab === "current"
                ? "bg-background-active text-foreground"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            {routineMode === "free" ? t("tabs.progress") : t("tabs.currentWeek")}
          </Link>
          <Link
            href={`/students/${slug}/workouts?tab=history`}
            className={`flex-1 rounded px-3 py-2 text-xs font-medium uppercase tracking-[0.08em] transition-all duration-150 md:flex-none ${
              activeTab === "history"
                ? "bg-background-active text-foreground"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            {t("tabs.history")}
          </Link>
        </div>
      </section>

      {activeTab === "current" ? (
        <WorkoutsTrackerClient
          studentId={slug}
          activeRoutineName={activeRoutine?.name ?? null}
          routineMode={routineMode}
          currentWeekKey={currentWeekKey}
          currentWeekLabel={formatWeekKeyLabel(currentWeekKey, locale)}
          entries={activeEntries}
        />
      ) : weeks.length === 0 ? (
        <section className="mt-8 border border-dashed border-border bg-background-card p-8 rounded-lg">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
            {t("empty.kicker")}
          </div>
          <div className="mt-4 text-xl font-semibold text-foreground">
            {t("empty.title")}
          </div>
        </section>
      ) : (
        <WeekTabs
          studentId={slug}
          currentWeekKey={currentWeekKey}
          data={weekData}
        />
      )}
    </AppShell>
  );
}
