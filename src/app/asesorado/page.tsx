import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { formatShortDate, formatWeekKeyLabel } from "@/lib/date-format";
import { pbGetOne, pbList } from "@/lib/pocketbase";
import StudentPicker from "./StudentPicker";
import DaySelector from "./DaySelector";
import DayExercisesCrud from "./DayExercisesCrud";

type StudentRecord = {
  id: string;
  name: string;
  phone?: string;
  status?: string;
};

type StudentRoutineRecord = {
  id: string;
  routine_id: string;
  status: string;
  expand?: {
    routine_id?: {
      id: string;
      name: string;
      level?: string;
      days_per_week?: number;
      mode?: "weekly" | "free";
    };
  };
};

type RoutineExerciseRecord = {
  id: string;
  day_index: number;
  day_label?: string;
  sets?: number | string;
  reps?: string;
  order_index?: number;
  expand?: {
    exercise_id?: {
      name?: string;
      muscle_group?: string;
    };
  };
};

type ExerciseCompletionRecord = {
  id: string;
  routine_exercise_id: string;
  completed_at: string;
  week_key: string;
  status: "completed" | "skipped";
  sets?: number;
  reps?: string;
  weight?: number;
  expand?: {
    routine_exercise_id?: {
      day_index?: number;
      expand?: {
        exercise_id?: {
          name?: string;
          muscle_group?: string;
        };
      };
    };
  };
};

type AsesoradoPageProps = {
  searchParams: Promise<{ day?: string; student?: string }>;
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getWeekKey(date: Date): string {
  const weekStart = getWeekStart(date);
  return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
}

function getPreviousWeekKey(baseDate: Date): string {
  const prev = new Date(baseDate);
  prev.setDate(prev.getDate() - 7);
  return getWeekKey(prev);
}

function dayIndexFromDate(date: Date): number {
  return date.getDay() + 1;
}

export default async function AsesoradoPage({ searchParams }: AsesoradoPageProps) {
  const locale = await getLocale();
  const params = await searchParams;
  const selectedStudentId = (params.student ?? "").trim();
  const now = new Date();
  const currentWeekKey = getWeekKey(now);
  const currentDayIndex = dayIndexFromDate(now);
  const previousWeekKey = getPreviousWeekKey(now);

  const studentsResult = await pbList<StudentRecord>("students", {
    perPage: 200,
    sort: "name",
  });
  const students = studentsResult.items.filter(
    (student) => (student.status ?? "").toLowerCase() !== "inactive",
  );

  if (!selectedStudentId) {
    return (
      <div className="min-h-screen w-full bg-background md:grid md:grid-cols-[1fr_minmax(0,430px)_1fr]">
        <aside
          aria-hidden="true"
          className="hidden border-r border-border md:block"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-18deg, rgba(26,26,26,0.06) 0px, rgba(26,26,26,0.06) 48px, transparent 48px, transparent 112px)",
          }}
        />
        <main className="min-h-[100dvh] w-full bg-background p-4 pb-[max(2rem,env(safe-area-inset-bottom))] md:border-x md:border-border">
          <header className="border-b border-border pb-4 pt-[max(0rem,env(safe-area-inset-top))]">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold text-foreground">Ingresar como</h1>
              <Link
                href="/students"
                className="inline-flex h-10 items-center rounded-md border border-border bg-background-card px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-background-muted"
              >
                Ver clientes
              </Link>
            </div>
            <p className="mt-1 text-sm text-foreground-secondary">Copia el link del alumno para compartir su acceso.</p>
          </header>

          <StudentPicker students={students} />
        </main>
        <aside
          aria-hidden="true"
          className="hidden border-l border-border md:block"
          style={{
            backgroundImage:
              "repeating-linear-gradient(18deg, rgba(26,26,26,0.06) 0px, rgba(26,26,26,0.06) 48px, transparent 48px, transparent 112px)",
          }}
        />
      </div>
    );
  }

  const [student, activeRoutineResult, completionsResult] = await Promise.all([
    pbGetOne<StudentRecord>("students", selectedStudentId),
    pbList<StudentRoutineRecord>("student_routines", {
      filter: `student_id=\"${selectedStudentId}\" && status=\"active\"`,
      perPage: 1,
      expand: "routine_id",
    }),
    pbList<ExerciseCompletionRecord>("exercise_completions", {
      filter: `student_id=\"${selectedStudentId}\"`,
      perPage: 500,
      sort: "-completed_at",
      expand: "routine_exercise_id.exercise_id",
    }),
  ]);

  if (!student) {
    notFound();
  }

  if ((student.status ?? "").toLowerCase() === "inactive") {
    notFound();
  }

  const activeRoutine = activeRoutineResult.items[0]?.expand?.routine_id;
  const routineMode = activeRoutine?.mode ?? "weekly";
  const allCompletions = completionsResult.items;
  const currentWeekCompletions = allCompletions.filter(
    (item) => item.week_key === currentWeekKey,
  );
  const previousWeekCompletions = allCompletions.filter(
    (item) => item.week_key === previousWeekKey,
  );
  const historySource =
    routineMode === "free" ? allCompletions : previousWeekCompletions;
  const completedCount = historySource.filter((item) => item.status === "completed").length;
  const skippedCount = historySource.filter((item) => item.status === "skipped").length;

  const routineExercisesResult = activeRoutine
    ? await pbList<RoutineExerciseRecord>("routine_exercises", {
        filter: `routine_id=\"${activeRoutine.id}\"`,
        perPage: 200,
        sort: "day_index,order_index",
        expand: "exercise_id",
      })
    : { items: [] as RoutineExerciseRecord[] };

  const allExercises = routineExercisesResult.items;
  const completionScope =
    routineMode === "free" ? allCompletions : currentWeekCompletions;
  const latestByExercise = completionScope.reduce(
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
  const availableDays = [...new Set(allExercises.map((entry) => entry.day_index))].sort((a, b) => a - b);
  const fallbackDayIndex = allExercises[0]?.day_index ?? currentDayIndex;
  const todayExercises = allExercises.filter((entry) => entry.day_index === currentDayIndex);
  const firstPendingDay = availableDays.find((day) =>
    allExercises
      .filter((entry) => entry.day_index === day)
      .some((entry) => !latestByExercise[entry.id]?.status),
  );
  const defaultDayIndex =
    routineMode === "free"
      ? firstPendingDay ?? fallbackDayIndex
      : todayExercises.length > 0
        ? currentDayIndex
        : fallbackDayIndex;

  const parsedDay = Number(params.day);
  const selectedDayIndex =
    Number.isInteger(parsedDay) && availableDays.includes(parsedDay)
      ? parsedDay
      : defaultDayIndex;

  const visibleTodayExercises = allExercises
    .filter((entry) => entry.day_index === selectedDayIndex)
    .map((entry) => {
      const completion = latestByExercise[entry.id];
      return {
        routineExerciseId: entry.id,
        exerciseName: entry.expand?.exercise_id?.name ?? "Ejercicio",
        muscleGroup: entry.expand?.exercise_id?.muscle_group ?? "-",
        sets: entry.sets,
        reps: entry.reps,
        completionId: completion?.id,
        status: completion?.status,
        loggedSets: completion?.sets,
        loggedReps: completion?.reps,
        loggedWeight: completion?.weight,
      };
    });

  return (
    <div className="min-h-screen w-full bg-background md:grid md:grid-cols-[1fr_minmax(0,430px)_1fr]">
      <aside
        aria-hidden="true"
        className="hidden border-r border-border md:block"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-18deg, rgba(26,26,26,0.06) 0px, rgba(26,26,26,0.06) 48px, transparent 48px, transparent 112px)",
        }}
      />
      <main className="min-h-[100dvh] w-full bg-background p-4 pb-[max(2rem,env(safe-area-inset-bottom))] md:border-x md:border-border">
        <header className="border-b border-border pb-4 pt-[max(0rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">{student.name}</h1>
            <Link
              href="/students"
              className="inline-flex h-10 items-center rounded-md border border-border bg-background-card px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-background-muted"
            >
              Ver clientes
            </Link>
          </div>
        </header>

        <section className="mt-6 border border-border bg-background-card rounded-lg p-5">
          <h2 className="text-lg font-semibold text-foreground">
            {activeRoutine?.name ?? "Sin rutina activa"}
          </h2>

          {activeRoutine ? (
            <p className="mt-1 text-sm text-foreground-secondary">
              {routineMode === "free"
                ? `Día programado ${selectedDayIndex}`
                : `${formatShortDate(now, locale)} · Día ${selectedDayIndex}`}
            </p>
          ) : (
            <p className="mt-2 text-sm text-foreground-secondary">
              Pide a tu entrenador que te asigne una rutina.
            </p>
          )}

          {activeRoutine && availableDays.length > 0 ? (
            <DaySelector
              studentId={student.id}
              availableDays={availableDays}
              selectedDayIndex={selectedDayIndex}
            />
          ) : null}

          <DayExercisesCrud
            studentId={student.id}
            currentWeekKey={currentWeekKey}
            entries={visibleTodayExercises}
          />
        </section>

        <section className="mt-6 border border-border bg-background-card rounded-lg p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {routineMode === "free" ? "Historial" : "Semana pasada"}
              </div>
              <h2 className="mt-2 text-lg font-semibold text-foreground">
                {routineMode === "free"
                  ? "Últimos registros"
                  : formatWeekKeyLabel(previousWeekKey, locale)}
              </h2>
            </div>
            <span className="rounded-[4px] bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
              {completedCount} completados
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="border border-border rounded-md p-3">
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Completados</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{completedCount}</div>
            </div>
            <div className="border border-border rounded-md p-3">
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Omitidos</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{skippedCount}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {historySource.slice(0, 6).map((item) => (
              <div key={item.id} className="border border-border rounded-md p-3">
                <div className="text-sm font-medium text-foreground">
                  {item.expand?.routine_exercise_id?.expand?.exercise_id?.name ?? "Ejercicio"}
                </div>
                <div className="mt-1 text-xs text-foreground-secondary">
                  {formatShortDate(item.completed_at, locale)} · {item.status}
                </div>
              </div>
            ))}
            {historySource.length === 0 ? (
              <div className="border border-border rounded-md p-3 text-sm text-foreground-secondary">
                {routineMode === "free"
                  ? "No hay registros todavía."
                  : "No hay registros en la semana pasada."}
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <aside
        aria-hidden="true"
        className="hidden border-l border-border md:block"
        style={{
          backgroundImage:
            "repeating-linear-gradient(18deg, rgba(26,26,26,0.06) 0px, rgba(26,26,26,0.06) 48px, transparent 48px, transparent 112px)",
        }}
      />
    </div>
  );
}
