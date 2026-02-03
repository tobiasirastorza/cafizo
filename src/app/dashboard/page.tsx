import AppShell from "../components/AppShell";
import { getLocale, getTranslations } from "next-intl/server";
import { pbList } from "@/lib/pocketbase";
import DashboardClient from "./DashboardClient";

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

interface MarqueeItem {
  name: string;
  key: string;
  count?: number;
  detail?: string;
}

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

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard");
  const locale = await getLocale();

  // Fetch real data
  const [
    studentsResult,
    completionsResult,
    activeRoutinesResult,
  ] = await Promise.all([
    pbList<StudentRecord>("students", { perPage: 200 }),
    pbList<ExerciseCompletionRecord>("exercise_completions", {
      perPage: 500,
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

  // Calculate stats
  const activeClients = students.filter((s) => s.status === "active").length;

  // Sessions this week
  const currentWeekKey = getWeekKey(new Date());
  const sessionsThisWeek = completions.filter((c) => {
    const completionWeek = getWeekKey(new Date(c.completed_at));
    return completionWeek === currentWeekKey;
  }).length;

  // Adherence: (actual completions / expected) * 100
  const expectedSessions = activeClients * 3;
  const adherence = expectedSessions > 0 
    ? Math.round((sessionsThisWeek / expectedSessions) * 100)
    : 0;

  // Find clients with issues for marquee
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Missed sessions: active clients with no completions in last 3 days
  const missedSessionsClients: MarqueeItem[] = activeRoutines
    .filter((routine) => {
      const lastCompletion = completions.find(
        (c) => c.student_id === routine.student_id
      );
      if (!lastCompletion) return true;
      return new Date(lastCompletion.completed_at) < threeDaysAgo;
    })
    .slice(0, 3)
    .map((r) => ({
      name: r.expand?.student_id?.name || "Unknown",
      key: "missedSessions",
      count: Math.floor((now.getTime() - new Date(r.started_at).getTime()) / (24 * 60 * 60 * 1000)),
    }));

  // Programs ending soon: > 80% progress
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

  // Stalled progress: no progress update in 7+ days
  const stalledClients: MarqueeItem[] = activeRoutines
    .filter((routine) => {
      const completionsForStudent = completions.filter(
        (c) => c.student_id === routine.student_id
      );
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

  // Build marquee items (mix of real issues + fallback to keep it populated)
  const marqueeItems: MarqueeItem[] = [
    ...missedSessionsClients,
    ...endingSoonClients,
    ...stalledClients,
  ].slice(0, 6);

  // If no real issues, show some active clients as positive news
  if (marqueeItems.length < 3) {
    const activeNames: MarqueeItem[] = activeRoutines
      .slice(0, 4 - marqueeItems.length)
      .map((r) => ({
        name: r.expand?.student_id?.name || "Unknown",
        key: "activeClient",
      }));
    marqueeItems.push(...activeNames);
  }

  // Recent sessions (last 5 completions)
  const recentSessions = completions.slice(0, 5).map((completion) => {
    const date = new Date(completion.completed_at);
    const exerciseName = completion.expand?.routine_exercise_id?.expand?.exercise_id?.name || "Unknown exercise";
    const sets = completion.sets;
    const reps = completion.reps;
    const weight = completion.weight;
    const weekKey = getWeekKey(date);

    return {
      time: date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
      name: completion.expand?.student_id?.name || "Unknown",
      date: date.toLocaleDateString(locale, { month: "short", day: "numeric" }),
      isToday: date.toDateString() === now.toDateString(),
      exerciseName,
      sets,
      reps,
      weight,
      weekKey,
    };
  });

  // Alerts based on real issues
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

  return (
    <AppShell>
      <DashboardClient
        marqueeItems={marqueeItems}
        stats={stats}
        recentSessions={recentSessions}
        alerts={alerts}
      />
    </AppShell>
  );
}
