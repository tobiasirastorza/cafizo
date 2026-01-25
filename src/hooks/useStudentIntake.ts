"use client";

import { useCallback } from "react";

type StudentPayload = {
  name: string;
  status?: string;
  days_active?: number;
  last_session_at?: string;
};

type RoutinePayload = {
  name: string;
  student_id: string;
  days_per_week: number;
  level: string;
  split: string;
  trainer_id: string;
};

type RoutineExercisePayload = {
  routine_id: string;
  exercise_id: string;
  sets?: string;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
  day_index: number;
  day_label: string;
  order_index: number;
};

type StudentRoutinePayload = {
  student_id: string;
  routine_id: string;
  status: string;
  progress_current?: number;
  progress_total?: number;
  started_at?: string;
};

const PB_BASE =
  (process.env.NEXT_PUBLIC_PB_URL ?? "http://127.0.0.1:8090/api").replace(
    /\/$/,
    "",
  );
const HARD_CODED_TRAINER_ID = "7lx85j81plat8s4";

function buildUrl(path: string) {
  return `${PB_BASE}${path}`;
}

export default function useStudentIntake() {
  const createStudentWithRoutine = useCallback(
    async (payload: {
      student: StudentPayload;
      routine: { name: string; days_per_week: number; level: string; split: string };
      days: Array<{
        label: string;
        exercises: Array<{
          exercise_id: string;
          sets?: string;
          reps?: string;
          rest_seconds?: number;
          notes?: string;
        }>;
      }>;
    }) => {
      const studentRes = await fetch(buildUrl("/collections/students/records"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload.student,
          trainer_id: HARD_CODED_TRAINER_ID,
        }),
      });
      if (!studentRes.ok) {
        throw new Error("Failed to create student");
      }
      const student = (await studentRes.json()) as { id: string };

      const routinePayload: RoutinePayload = {
        name: payload.routine.name,
        student_id: student.id,
        days_per_week: payload.routine.days_per_week,
        level: payload.routine.level,
        split: payload.routine.split,
        trainer_id: HARD_CODED_TRAINER_ID,
      };
      const routineRes = await fetch(buildUrl("/collections/routines/records"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routinePayload),
      });
      if (!routineRes.ok) {
        throw new Error("Failed to create routine");
      }
      const routine = (await routineRes.json()) as { id: string };

      const routineExerciseRequests: RoutineExercisePayload[] = [];
      payload.days.forEach((day, dayIndex) => {
        day.exercises.forEach((exercise, exerciseIndex) => {
          routineExerciseRequests.push({
            routine_id: routine.id,
            exercise_id: exercise.exercise_id,
            sets: exercise.sets || undefined,
            reps: exercise.reps || undefined,
            rest_seconds: exercise.rest_seconds,
            notes: exercise.notes || undefined,
            day_index: dayIndex + 1,
            day_label: day.label,
            order_index: exerciseIndex + 1,
          });
        });
      });

      if (routineExerciseRequests.length > 0) {
        await Promise.all(
          routineExerciseRequests.map((entry) =>
            fetch(buildUrl("/collections/routine_exercises/records"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(entry),
            }),
          ),
        );
      }

      const assignmentPayload: StudentRoutinePayload = {
        student_id: student.id,
        routine_id: routine.id,
        status: "active",
        progress_current: 0,
        progress_total: payload.routine.days_per_week,
        started_at: new Date().toISOString(),
      };
      const assignmentRes = await fetch(
        buildUrl("/collections/student_routines/records"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assignmentPayload),
        },
      );
      if (!assignmentRes.ok) {
        throw new Error("Failed to assign routine");
      }

      return { studentId: student.id, routineId: routine.id };
    },
    [],
  );

  return { createStudentWithRoutine };
}
