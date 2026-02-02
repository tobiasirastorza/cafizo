import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

type Translator = Awaited<ReturnType<typeof getTranslations>>;

import AppShell from "../../components/AppShell";
import { pbGetOne, pbList } from "@/lib/pocketbase";

type StudentRecord = {
  id: string;
  name: string;
  status?: string;
  days_active?: number;
  last_session_at?: string;
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
  started_at?: string;
  completed_at?: string | null;
  progress_current?: number;
  progress_total?: number;
  expand?: {
    routine_id?: RoutineRecord;
  };
};

type StudentProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDateTime(
  value: string | null | undefined,
  locale: string,
  t: Translator,
) {
  if (!value) return t("noSessions");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("noSessions");
  return date.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDate(value: string | null | undefined, locale: string, t: Translator) {
  if (!value) return t("completed");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("completed");
  return t("completedOn", {
    date: date.toLocaleDateString(locale, { dateStyle: "medium" }),
  });
}

export default async function StudentProfilePage({
  params,
}: StudentProfilePageProps) {
  const { slug } = await params;
  const t = await getTranslations("StudentProfile");
  const locale = await getLocale();

  const [student, activeRoutineResult, completedRoutinesResult] =
    await Promise.all([
      pbGetOne<StudentRecord>("students", slug),
      pbList<StudentRoutineRecord>("student_routines", {
        filter: `student_id=\"${slug}\" && status=\"active\"`,
        expand: "routine_id",
        perPage: 1,
      }),
      pbList<StudentRoutineRecord>("student_routines", {
        filter: `student_id=\"${slug}\" && status=\"completed\"`,
        expand: "routine_id",
        perPage: 12,
        sort: "-completed_at",
      }),
    ]);

  if (!student) {
    notFound();
  }

  const activeAssignment = activeRoutineResult.items[0];
  const activeRoutine = activeAssignment?.expand?.routine_id;

  return (
    <AppShell>
      <section>
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-lg font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          {t("backToStudents")}
        </Link>
        <h1 className="mt-6 text-[clamp(3.5rem,11vw,11rem)] font-bold uppercase leading-[0.85] tracking-tighter">
          {student.name}
        </h1>
      </section>

      <section className="border-border pb-12">
        <div className="mt-6 border border-border bg-background p-8 md:p-10">
          <div className="text-base font-bold uppercase tracking-widest text-accent">
            {activeRoutine ? t("activeProgram") : t("noActiveProgram")}
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold uppercase tracking-tight text-foreground md:text-5xl">
              {activeRoutine?.name ?? t("noRoutineAssigned")}
            </h2>
            <p className="mt-3 text-lg font-medium text-muted-foreground md:text-xl">
              {activeRoutine
                ? `${activeRoutine.level?.toUpperCase() ?? t("unspecified")} • ${
                    activeRoutine.split?.toUpperCase() ?? t("unspecified")
                  }`
                : t("assignRoutine")}
            </p>
          </div>
          {activeRoutine ? (
            <Link
              href={`/students/${slug}/workouts`}
              className="mt-8 inline-flex h-12 items-center justify-center border-2 border-border px-6 text-lg font-bold uppercase tracking-widest text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
            >
              {t("viewWorkouts")}
            </Link>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
