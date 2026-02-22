"use client";

import { useTranslations } from "next-intl";

interface MarqueeItem {
  name: string;
  key: string;
  count?: number;
  detail?: string;
}

interface SessionItem {
  time: string;
  name: string;
  date: string;
  isToday: boolean;
  exerciseName: string;
  sets?: number;
  reps?: string;
  weight?: number;
  weekKey: string;
  weekLabel: string;
}

interface AlertItem {
  titleKey: string;
  detailKey: string;
  actionKey: string;
  tone: "accent" | "muted" | "danger";
  name: string;
}

interface DashboardClientProps {
  marqueeItems: MarqueeItem[];
  stats: Array<{ key: string; value: string; delta: string }>;
  recentSessions: SessionItem[];
  alerts: AlertItem[];
}

export default function DashboardClient({
  marqueeItems,
  stats,
  recentSessions,
  alerts,
}: DashboardClientProps) {
  const t = useTranslations("Dashboard");
  return (
    <div className="flex flex-col gap-4">
      {/* Stats Grid - KPI Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="group relative overflow-hidden border border-border bg-background-card p-5 rounded-lg transition-all duration-150"
          >
            {/* Label */}
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
              {t(`stats.${stat.key}`)}
            </div>

            {/* KPI Number */}
            <div className="flex items-baseline gap-2">
              <span className="text-[2rem] font-semibold leading-none tracking-tight text-foreground md:text-[2.5rem]">
                {stat.value}
              </span>
              {stat.delta && (
                <span className="text-sm font-normal text-accent">
                  {stat.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Recent Activity */}
      <section className="border border-border bg-background-card rounded-lg p-5">
        {/* Section Header */}
        <div className="mb-4 pb-3 border-b border-border-subtle">
          <h2 className="text-xl font-semibold text-foreground md:text-2xl">
            {t("recentActivity")}
          </h2>
        </div>

        {/* Activity List */}
        <div className="flex flex-col gap-2">
          {recentSessions.length === 0 ? (
            <div className="bg-background-muted p-6 text-center rounded-md">
              <p className="text-sm text-foreground-secondary">
                {t("noActivity")}
              </p>
            </div>
          ) : (
            recentSessions.map((session, idx) => (
              <div
                key={`${idx}-${session.name}-${session.exerciseName}`}
                className="group flex flex-col gap-2 border border-border bg-background-card p-4 rounded-md transition-all duration-150 hover:bg-background-muted"
              >
                {/* Top Row: Time + Student + Date + Week */}
                <div className="flex flex-wrap items-baseline gap-2">
                  {/* Time */}
                  <div className="text-base font-semibold leading-none text-foreground">
                    {session.time}
                  </div>

                  {/* Separator */}
                  <div className="text-foreground-muted">·</div>

                  {/* Student Name */}
                  <div className="text-sm font-medium leading-none text-foreground">
                    {session.name}
                  </div>

                  {/* Separator */}
                  <div className="text-foreground-muted">·</div>

                  {/* Date */}
                  <div className="text-xs uppercase tracking-[0.08em] text-foreground-muted">
                    {session.isToday ? t("today") : session.date}
                  </div>

                  {/* Separator */}
                  <div className="text-foreground-muted">·</div>

                  {/* Week Key */}
                  <div className="text-xs uppercase tracking-[0.08em] text-foreground-secondary">
                    W. {session.weekLabel}
                  </div>
                </div>

                {/* Bottom Row: Exercise Details */}
                <div className="flex flex-wrap items-baseline gap-2">
                  {/* Exercise Name */}
                  <div className="text-sm font-medium text-foreground">
                    {session.exerciseName}
                  </div>

                  {/* Workout Details */}
                  {(session.sets || session.reps || session.weight) && (
                    <>
                      <div className="text-foreground-muted">·</div>
                      <div className="flex gap-2 text-xs text-foreground-secondary">
                        {session.sets && <span>{session.sets} sets</span>}
                        {session.reps && (
                          <>
                            {session.sets && <span>×</span>}
                            <span>{session.reps} reps</span>
                          </>
                        )}
                        {session.weight && (
                          <>
                            <span>@</span>
                            <span>{session.weight}kg</span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
