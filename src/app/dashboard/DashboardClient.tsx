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
    <div className="flex flex-col gap-px">
      {/* Stats Grid - Massive Numbers with Kinetic Typography */}
      <section className="grid grid-cols-1 gap-px bg-[#3F3F46] md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="group relative overflow-hidden border-2 border-[#3F3F46] bg-[#09090B] p-4 transition-all duration-300 hover:border-accent hover:bg-accent md:p-6"
          >
            {/* Label */}
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors duration-300 group-hover:text-black">
              {t(`stats.${stat.key}`)}
            </div>

            {/* Massive Number */}
            <div className="flex items-baseline gap-2">
              <span className="text-[3rem] font-bold leading-none tracking-tighter text-accent transition-colors duration-300 group-hover:text-black md:text-[4rem] lg:text-[5rem]">
                {stat.value}
              </span>
              {stat.delta && (
                <span className="text-xl font-bold uppercase tracking-tighter text-foreground transition-colors duration-300 group-hover:text-black md:text-2xl">
                  {stat.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Recent Activity - Enhanced Typography */}
      <section className="border-2 border-[#3F3F46] bg-[#09090B] p-4 md:p-6">
        {/* Section Header */}
        <div className="mb-4 border-b-2 border-[#3F3F46] pb-3">
          <h2 className="text-2xl font-bold uppercase leading-tight tracking-tighter text-foreground md:text-3xl lg:text-4xl">
            {t("recentActivity")}
          </h2>
        </div>

        {/* Activity List */}
        <div className="flex flex-col gap-px bg-[#3F3F46]">
          {recentSessions.length === 0 ? (
            <div className="bg-[#09090B] p-6 text-center">
              <p className="text-base font-bold uppercase tracking-wide text-muted-foreground md:text-lg">
                {t("noActivity")}
              </p>
            </div>
          ) : (
            recentSessions.map((session, idx) => (
              <div
                key={`${idx}-${session.name}-${session.exerciseName}`}
                className="group flex flex-col gap-3 border-2 border-[#3F3F46] bg-[#09090B] p-4 transition-all duration-300 hover:border-accent hover:bg-accent md:p-5"
              >
                {/* Top Row: Time + Student + Date + Week */}
                <div className="flex flex-wrap items-baseline gap-3">
                  {/* Time */}
                  <div className="text-xl font-bold uppercase leading-none tracking-tighter text-muted transition-colors duration-300 group-hover:text-black md:text-2xl">
                    {session.time}
                  </div>

                  {/* Separator */}
                  <div className="text-muted transition-colors duration-300 group-hover:text-black">·</div>

                  {/* Student Name */}
                  <div className="text-base font-bold uppercase leading-none tracking-tight text-foreground transition-colors duration-300 group-hover:text-black md:text-lg">
                    {session.name}
                  </div>

                  {/* Separator */}
                  <div className="text-muted-foreground transition-colors duration-300 group-hover:text-black/70">·</div>

                  {/* Date */}
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors duration-300 group-hover:text-black/70">
                    {session.isToday ? t("today") : session.date}
                  </div>

                  {/* Separator */}
                  <div className="text-muted-foreground transition-colors duration-300 group-hover:text-black/70">·</div>

                  {/* Week Key */}
                  <div className="text-xs font-bold uppercase tracking-widest text-muted transition-colors duration-300 group-hover:text-black">
                    W.{session.weekKey}
                  </div>
                </div>

                {/* Bottom Row: Exercise Details */}
                <div className="flex flex-wrap items-baseline gap-3">
                  {/* Exercise Name */}
                  <div className="text-sm font-bold uppercase tracking-tight text-accent transition-colors duration-300 group-hover:text-black md:text-base">
                    {session.exerciseName}
                  </div>

                  {/* Workout Details */}
                  {(session.sets || session.reps || session.weight) && (
                    <>
                      <div className="text-muted-foreground transition-colors duration-300 group-hover:text-black/70">·</div>
                      <div className="flex gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors duration-300 group-hover:text-black/70">
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
