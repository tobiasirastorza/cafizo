import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import AppShell from "../../components/AppShell";
import { pbGetOne, pbList } from "@/lib/pocketbase";
import ClientProfileClient from "./ClientProfileClient";

type StudentRecord = {
  id: string;
  name: string;
  status?: string;
  phone?: string;
  created?: string;
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

type ExerciseCompletionRecord = {
  id: string;
  completed_at: string;
  status: string;
  sets?: number;
  reps?: string;
  weight?: number;
  expand?: {
    routine_exercise_id?: {
      expand?: {
        exercise_id?: {
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
  order_index?: number;
  started_at?: string;
  completed_at?: string;
  ended_at?: string;
  expand?: {
    routine_id?: RoutineRecord;
  };
};

type StudentProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function StudentProfilePage({
  params,
}: StudentProfilePageProps) {
  const { slug } = await params;
  await getTranslations("ClientProfile");

  const [
    student,
    allRoutinesResult,
    exerciseCompletionsResult,
    routineAssignmentsResult,
  ] = await Promise.all([
    pbGetOne<StudentRecord>("students", slug),
    pbList<RoutineRecord>("routines", { perPage: 50 }),
    pbList<ExerciseCompletionRecord>("exercise_completions", {
      filter: `student_id="${slug}"`,
      perPage: 200,
      sort: "-completed_at",
      expand: "routine_exercise_id.exercise_id",
    }),
    pbList<StudentRoutineRecord>("student_routines", {
      filter: `student_id="${slug}"`,
      perPage: 50,
      sort: "order_index,-started_at",
      expand: "routine_id",
    }),
  ]);

  if (!student) {
    notFound();
  }

  const routineAssignments = routineAssignmentsResult.items;
  const activeAssignment =
    routineAssignments.find((assignment) => assignment.status === "active") ?? null;

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <ClientProfileClient
          student={student}
          activeAssignment={activeAssignment}
          availableRoutines={allRoutinesResult.items}
          exerciseCompletions={exerciseCompletionsResult.items}
          routineAssignments={routineAssignments}
          slug={slug}
        />
      </div>
    </AppShell>
  );
}
