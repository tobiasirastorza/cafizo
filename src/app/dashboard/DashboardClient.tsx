"use client";

import { useMemo, useState } from "react";
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
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const filteredSessions = useMemo(() => {
    if (!normalizedSearch) return recentSessions;

    return recentSessions.filter((session) => {
      const progress = [
        session.sets ? `${session.sets} sets` : "",
        session.reps ? `${session.reps} reps` : "",
        session.weight ? `${session.weight}kg` : "",
      ].join(" ");

      const searchable = `${session.name} ${session.exerciseName} ${session.date} ${session.time} ${progress}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [normalizedSearch, recentSessions]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
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
      <section className="flex min-h-0 flex-1 flex-col border border-border bg-background-card rounded-lg p-5">
        {/* Section Header */}
        <div className="mb-3 border-b border-border-subtle pb-3">
          <h2 className="text-xl font-semibold text-foreground md:text-2xl">
            {t("recentActivity")}
          </h2>
        </div>

        <div className="mb-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("activitySearchPlaceholder")}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-foreground-muted md:max-w-sm"
          />
        </div>

        {/* Activity List */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1">
            {filteredSessions.length === 0 ? (
              <div className="bg-background-muted p-6 text-center rounded-md">
                <p className="text-sm text-foreground-secondary">
                  {normalizedSearch ? t("noActivityMatches") : t("noActivity")}
                </p>
              </div>
            ) : (
              filteredSessions.map((session, idx) => {
                const progress = [
                  session.sets ? `${session.sets} sets` : null,
                  session.reps ? `${session.reps} reps` : null,
                  session.weight ? `${session.weight}kg` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div
                    key={`${idx}-${session.name}-${session.exerciseName}`}
                    className="group flex items-center gap-2 border border-border bg-background-card px-3 py-2 rounded-md text-sm transition-colors hover:bg-background-muted"
                  >
                    <span className="min-w-0 shrink-0 font-medium text-foreground">
                      {session.name}
                    </span>
                    <span className="text-foreground-muted">·</span>
                    <span className="shrink-0 text-[11px] uppercase tracking-[0.06em] text-foreground-muted">
                      {session.isToday ? t("today") : session.date} {session.time}
                    </span>
                    <span className="text-foreground-muted">·</span>
                    <span className="min-w-0 truncate text-foreground">
                      {session.exerciseName}
                    </span>
                    <span className="text-foreground-muted">·</span>
                    <span className="shrink-0 text-xs text-foreground-secondary">
                      {progress || "—"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
