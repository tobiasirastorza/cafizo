const PB_BASE = "https://pb.barrani.app/api";

function buildUrl(path: string) {
  return `${PB_BASE}${path}`;
}

export async function recalculateRoutineProgress(
  studentId: string,
  currentWeekKey: string,
) {
  const assignmentRes = await fetch(
    buildUrl(
      `/collections/student_routines/records?filter=${encodeURIComponent(
        `student_id=\"${studentId}\" && status=\"active\"`,
      )}&expand=routine_id&perPage=1`,
    ),
    { cache: "no-store" },
  );

  if (!assignmentRes.ok) {
    throw new Error("Failed to load active routine assignment.");
  }

  const assignmentData = (await assignmentRes.json()) as {
    items: Array<{
      id: string;
      routine_id: string;
      expand?: { routine_id?: { mode?: "weekly" | "free" } };
    }>;
  };
  const assignment = assignmentData.items[0];
  if (!assignment) return;
  const routineMode = assignment.expand?.routine_id?.mode ?? "weekly";

  const routineExercisesRes = await fetch(
    buildUrl(
      `/collections/routine_exercises/records?filter=${encodeURIComponent(
        `routine_id=\"${assignment.routine_id}\"`,
      )}&perPage=500`,
    ),
    { cache: "no-store" },
  );
  if (!routineExercisesRes.ok) {
    throw new Error("Failed to load routine exercises.");
  }

  const routineExercisesData = (await routineExercisesRes.json()) as {
    items: Array<{ id: string }>;
  };
  const routineExerciseIds = new Set(
    routineExercisesData.items.map((item) => item.id),
  );

  const completionsRes = await fetch(
    buildUrl(
      `/collections/exercise_completions/records?filter=${encodeURIComponent(
        routineMode === "free"
          ? `student_id=\"${studentId}\" && status=\"completed\"`
          : `student_id=\"${studentId}\" && week_key=\"${currentWeekKey}\" && status=\"completed\"`,
      )}&expand=routine_exercise_id&perPage=500`,
    ),
    { cache: "no-store" },
  );
  if (!completionsRes.ok) {
    throw new Error("Failed to load completions.");
  }

  const completionsData = (await completionsRes.json()) as {
    items: Array<{
      routine_exercise_id?: string;
      expand?: { routine_exercise_id?: { id: string } };
    }>;
  };

  const completedInRoutine = new Set<string>();
  completionsData.items.forEach((item) => {
    const routineExerciseId =
      item.routine_exercise_id || item.expand?.routine_exercise_id?.id;
    if (routineExerciseId && routineExerciseIds.has(routineExerciseId)) {
      completedInRoutine.add(routineExerciseId);
    }
  });

  const updateRes = await fetch(
    buildUrl(`/collections/student_routines/records/${assignment.id}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        progress_current: completedInRoutine.size,
        progress_total: routineExerciseIds.size,
      }),
    },
  );

  if (!updateRes.ok) {
    throw new Error("Failed to update routine progress.");
  }
}

export function buildPocketBaseUrl(path: string) {
  return buildUrl(path);
}
