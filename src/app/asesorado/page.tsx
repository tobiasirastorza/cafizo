import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { formatShortDate, formatWeekKeyLabel } from "@/lib/date-format";
import { pbGetOne, pbList } from "@/lib/pocketbase";

type StudentRecord = {
  id: string;
  name: string;
  phone?: string;
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
  const currentDayIndex = dayIndexFromDate(now);
  const previousWeekKey = getPreviousWeekKey(now);

  const studentsResult = await pbList<StudentRecord>("students", {
    perPage: 200,
    sort: "name",
  });
  const students = studentsResult.items;

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
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Kinetic Asesorado</div>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">Ingresar como</h1>
            <p className="mt-1 text-sm text-foreground-secondary">Selecciona un alumno para testear la vista.</p>
          </header>

          <section className="mt-6 flex flex-col gap-2">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/asesorado?student=${student.id}`}
                className="border border-border bg-background-card rounded-md p-3 transition-colors duration-150 hover:bg-background-muted"
              >
                <div className="text-sm font-medium text-foreground">{student.name}</div>
                <div className="mt-1 text-xs text-foreground-secondary">{student.phone ?? "-"}</div>
              </Link>
            ))}
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

  const [student, activeRoutineResult, lastWeekCompletionsResult] = await Promise.all([
    pbGetOne<StudentRecord>("students", selectedStudentId),
    pbList<StudentRoutineRecord>("student_routines", {
      filter: `student_id=\"${selectedStudentId}\" && status=\"active\"`,
      perPage: 1,
      expand: "routine_id",
    }),
    pbList<ExerciseCompletionRecord>("exercise_completions", {
      filter: `student_id=\"${selectedStudentId}\" && week_key=\"${previousWeekKey}\"`,
      perPage: 200,
      sort: "-completed_at",
      expand: "routine_exercise_id.exercise_id",
    }),
  ]);

  if (!student) {
    notFound();
  }

  const activeRoutine = activeRoutineResult.items[0]?.expand?.routine_id;
  const completedCount = lastWeekCompletionsResult.items.filter((item) => item.status === "completed").length;
  const skippedCount = lastWeekCompletionsResult.items.filter((item) => item.status === "skipped").length;

  const routineExercisesResult = activeRoutine
    ? await pbList<RoutineExerciseRecord>("routine_exercises", {
        filter: `routine_id=\"${activeRoutine.id}\"`,
        perPage: 200,
        sort: "day_index,order_index",
        expand: "exercise_id",
      })
    : { items: [] as RoutineExerciseRecord[] };

  const allExercises = routineExercisesResult.items;
  const availableDays = [...new Set(allExercises.map((entry) => entry.day_index))].sort((a, b) => a - b);
  const todayExercises = allExercises.filter((entry) => entry.day_index === currentDayIndex);
  const fallbackDayIndex = allExercises[0]?.day_index ?? currentDayIndex;
  const defaultDayIndex = todayExercises.length > 0 ? currentDayIndex : fallbackDayIndex;

  const parsedDay = Number(params.day);
  const selectedDayIndex =
    Number.isInteger(parsedDay) && availableDays.includes(parsedDay)
      ? parsedDay
      : defaultDayIndex;

  const visibleTodayExercises = allExercises.filter((entry) => entry.day_index === selectedDayIndex);

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
          <Link
            href="/asesorado"
            className="inline-flex items-center gap-3 text-2xl font-semibold leading-tight tracking-tight text-foreground transition-colors duration-150 hover:text-foreground-secondary"
          >
            <span aria-hidden="true" className="text-xl font-medium text-foreground-secondary">←</span>
            {student.name}
          </Link>
        </header>

        <section className="mt-6 border border-border bg-background-card rounded-lg p-5">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Rutina del día</div>
          <h2 className="mt-2 text-lg font-semibold text-foreground">
            {activeRoutine?.name ?? "Sin rutina activa"}
          </h2>

          {activeRoutine ? (
            <p className="mt-1 text-sm text-foreground-secondary">
              {formatShortDate(now, locale)} · Día {selectedDayIndex}
            </p>
          ) : (
            <p className="mt-2 text-sm text-foreground-secondary">
              Pide a tu entrenador que te asigne una rutina.
            </p>
          )}

          {activeRoutine && availableDays.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {availableDays.map((day) => (
                <Link
                  key={day}
                  href={`/asesorado?student=${student.id}&day=${day}`}
                  className={`inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors duration-150 ${
                    day === selectedDayIndex
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-background-card text-foreground hover:bg-background-muted"
                  }`}
                >
                  Día {day}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2">
            {!activeRoutine || visibleTodayExercises.length === 0 ? (
              <div className="border border-border rounded-md p-3 text-sm text-foreground-secondary">No hay ejercicios cargados para este día.</div>
            ) : (
              visibleTodayExercises.map((entry) => (
                <div key={entry.id} className="border border-border rounded-md p-3">
                  <div className="text-sm font-medium text-foreground">{entry.expand?.exercise_id?.name ?? "Ejercicio"}</div>
                  <div className="mt-1 text-xs text-foreground-secondary uppercase tracking-[0.08em]">
                    {entry.expand?.exercise_id?.muscle_group ?? "-"}
                  </div>
                  <div className="mt-2 text-sm text-foreground-secondary">
                    {entry.sets ?? "-"} x {entry.reps ?? "-"}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 border border-border bg-background-card rounded-lg p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Semana pasada</div>
              <h2 className="mt-2 text-lg font-semibold text-foreground">{formatWeekKeyLabel(previousWeekKey, locale)}</h2>
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
            {lastWeekCompletionsResult.items.slice(0, 6).map((item) => (
              <div key={item.id} className="border border-border rounded-md p-3">
                <div className="text-sm font-medium text-foreground">
                  {item.expand?.routine_exercise_id?.expand?.exercise_id?.name ?? "Ejercicio"}
                </div>
                <div className="mt-1 text-xs text-foreground-secondary">
                  {formatShortDate(item.completed_at, locale)} · {item.status}
                </div>
              </div>
            ))}
            {lastWeekCompletionsResult.items.length === 0 ? (
              <div className="border border-border rounded-md p-3 text-sm text-foreground-secondary">
                No hay registros en la semana pasada.
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
