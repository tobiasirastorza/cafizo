import { pbList } from "@/lib/pocketbase";
import { formatShortDate, formatWeekKeyLabel } from "@/lib/date-format";

type StudentRecord = {
  id: string;
  name: string;
  status: string;
  days_active?: number;
  last_session_at?: string;
};

type ExerciseCompletionRecord = {
  id: string;
  student_id: string;
  completed_at: string;
  sets?: number;
  reps?: string;
  weight?: number;
  status: string;
  expand?: {
    student_id?: StudentRecord;
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
  progress_current: number;
  progress_total: number;
  started_at: string;
  expand?: {
    student_id?: StudentRecord;
    routine_id?: {
      id: string;
      name: string;
    };
  };
};

type MarqueeItem = {
  name: string;
  key: string;
  count?: number;
  detail?: string;
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

export async function getDashboardData(locale: string) {
  const TODAY_FETCH_LIMIT = 2000;
  const [studentsResult, completionsResult, activeRoutinesResult] = await Promise.all([
    pbList<StudentRecord>("students", { perPage: 200 }),
    pbList<ExerciseCompletionRecord>("exercise_completions", {
      perPage: TODAY_FETCH_LIMIT,
      sort: "-completed_at",
      expand: "student_id,routine_exercise_id.exercise_id",
    }),
    pbList<StudentRoutineRecord>("student_routines", {
      filter: 'status="active"',
      perPage: 200,
      expand: "student_id,routine_id",
    }),
  ]);

  const students = studentsResult.items;
  const completions = completionsResult.items;
  const activeRoutines = activeRoutinesResult.items;

  const activeClients = students.filter((s) => s.status === "active").length;
  const currentWeekKey = getWeekKey(new Date());
  const sessionsThisWeek = completions.filter(
    (c) => getWeekKey(new Date(c.completed_at)) === currentWeekKey,
  ).length;

  const expectedSessions = activeClients * 3;
  const adherence =
    expectedSessions > 0
      ? Math.round((sessionsThisWeek / expectedSessions) * 100)
      : 0;

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const missedSessionsClients: MarqueeItem[] = activeRoutines
    .filter((routine) => {
      const lastCompletion = completions.find((c) => c.student_id === routine.student_id);
      if (!lastCompletion) return true;
      return new Date(lastCompletion.completed_at) < threeDaysAgo;
    })
    .slice(0, 3)
    .map((r) => ({
      name: r.expand?.student_id?.name || "Unknown",
      key: "missedSessions",
      count: Math.floor((now.getTime() - new Date(r.started_at).getTime()) / (24 * 60 * 60 * 1000)),
    }));

  const endingSoonClients: MarqueeItem[] = activeRoutines
    .filter((routine) => {
      const progress = (routine.progress_current / routine.progress_total) * 100;
      return progress > 80 && progress < 100;
    })
    .slice(0, 2)
    .map((r) => ({
      name: r.expand?.student_id?.name || "Unknown",
      key: "programEndingSoon",
      detail: r.expand?.routine_id?.name,
    }));

  const stalledClients: MarqueeItem[] = activeRoutines
    .filter((routine) => {
      const completionsForStudent = completions.filter((c) => c.student_id === routine.student_id);
      if (completionsForStudent.length === 0) return false;
      const lastCompletion = new Date(completionsForStudent[0].completed_at);
      return lastCompletion < sevenDaysAgo && routine.progress_current > 0;
    })
    .slice(0, 2)
    .map((r) => ({
      name: r.expand?.student_id?.name || "Unknown",
      key: "stalledProgress",
      detail: r.expand?.routine_id?.name,
    }));

  const marqueeItems: MarqueeItem[] = [
    ...missedSessionsClients,
    ...endingSoonClients,
    ...stalledClients,
  ].slice(0, 6);

  if (marqueeItems.length < 3) {
    const activeNames: MarqueeItem[] = activeRoutines
      .slice(0, 4 - marqueeItems.length)
      .map((r) => ({ name: r.expand?.student_id?.name || "Unknown", key: "activeClient" }));
    marqueeItems.push(...activeNames);
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const todayCompletions = completions.filter((completion) => {
    const completedAt = new Date(completion.completed_at);
    return completedAt >= startOfToday && completedAt < startOfTomorrow;
  });

  const recentSessions = todayCompletions.map((completion) => {
    const date = new Date(completion.completed_at);
    const weekKey = getWeekKey(date);
    return {
      time: date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
      name: completion.expand?.student_id?.name || "Unknown",
      date: formatShortDate(date, locale),
      isToday: date.toDateString() === now.toDateString(),
      exerciseName:
        completion.expand?.routine_exercise_id?.expand?.exercise_id?.name || "Unknown exercise",
      sets: completion.sets,
      reps: completion.reps,
      weight: completion.weight,
      weekKey,
      weekLabel: formatWeekKeyLabel(weekKey, locale),
    };
  });

  const alerts = [];
  if (stalledClients.length > 0) {
    alerts.push({
      titleKey: "stalledProgress",
      detailKey: "stalledProgressDetail",
      actionKey: "reviewData",
      tone: "accent" as const,
      name: stalledClients[0].name,
    });
  }
  if (endingSoonClients.length > 0) {
    alerts.push({
      titleKey: "programEnding",
      detailKey: "programEndingDetail",
      actionKey: "buildPhase",
      tone: "muted" as const,
      name: endingSoonClients[0].name,
    });
  }
  if (missedSessionsClients.length > 0) {
    alerts.push({
      titleKey: "missedSessions",
      detailKey: "missedSessionsDetail",
      actionKey: "sendAlert",
      tone: "danger" as const,
      name: missedSessionsClients[0].name,
    });
  }

  const stats = [
    { key: "activeClients", value: String(activeClients), delta: "" },
    { key: "sessionsThisWeek", value: String(sessionsThisWeek), delta: "" },
    { key: "adherence", value: String(adherence), delta: "%" },
  ];

  return { marqueeItems, stats, recentSessions, alerts };
}
