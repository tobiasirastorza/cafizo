import AppShell from "../components/AppShell";
import { getTranslations } from "next-intl/server";

const routines = [
  {
    level: "advanced",
    updated: "02.Oct.24",
    name: "Power Hypertrophy",
    split: "Push / Pull / Legs",
    daysPerWeek: 6,
  },
  {
    level: "intermediate",
    updated: "01.Oct.24",
    name: "Metabolic Shock",
    split: "Full body circuit",
    daysPerWeek: 3,
  },
  {
    level: "beginner",
    updated: "28.Sep.24",
    name: "Foundation Strength",
    split: "Upper / Lower",
    daysPerWeek: 4,
  },
];

const mostUsed = [
  { name: "Power Hypertrophy", count: 12 },
  { name: "Metabolic Shock", count: 8 },
  { name: "Foundation Strength", count: 5 },
];

const recentlyUpdated = [
  { name: "Phul Evolution", timeKey: "today", time: "14:32" },
  { name: "Summer Shred 2024", timeKey: "yesterday", time: "09:15" },
  { name: "Core Stabilizer Pro", timeKey: "date", time: "30.Sep.24" },
];

export default async function RoutinesPage() {
  const t = await getTranslations("Routines");

  return (
    <AppShell>
      <section className="border-b border-border pb-6">
        <div className="mt-4 flex flex-wrap items-center justify-between gap-6">
          <h1 className="text-[clamp(3rem,10vw,8rem)] font-bold uppercase leading-[0.85] tracking-tighter">
            {t("title")}
          </h1>
          <button className="flex h-14 items-center gap-3 border-2 border-accent bg-accent px-6 text-lg font-bold uppercase tracking-widest text-accent-foreground transition-transform duration-200 hover:scale-[1.02]">
            <span className="text-lg">+</span>
            {t("actions.create")}
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="divide-y divide-border">
          {routines.map((routine) => (
            <div key={routine.name} className="py-10">
              <div className="flex flex-wrap items-center gap-4 text-base font-bold uppercase tracking-widest text-muted-foreground">
                <span className="bg-muted px-3 py-1 text-foreground">
                  {t(`levels.${routine.level}`)}
                </span>
                <span>{t("lastUpdated", { date: routine.updated })}</span>
              </div>
              <div className="mt-6 text-[clamp(2.5rem,7vw,5rem)] font-bold uppercase leading-[0.9] tracking-tighter text-foreground">
                {routine.name}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-6 text-base font-bold uppercase tracking-widest text-foreground">
                <span>{routine.split}</span>
                <span className="text-muted-foreground">•</span>
                <span>{t("daysPerWeek", { count: routine.daysPerWeek })}</span>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button className="h-12 min-w-[220px] border-2 border-accent bg-accent px-6 text-lg font-bold uppercase tracking-widest text-accent-foreground transition-transform duration-200 hover:scale-[1.02]">
                  {t("actions.assign")}
                </button>
                <button className="h-12 border-2 border-border px-6 text-lg font-bold uppercase tracking-widest text-foreground">
                  {t("actions.edit")}
                </button>
                <button className="h-12 border-2 border-border px-6 text-lg font-bold uppercase tracking-widest text-foreground">
                  {t("actions.duplicate")}
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-8 border-l border-border pl-8">
          <div>
            <div className="text-base font-bold uppercase tracking-widest text-accent">
              {t("mostUsed")}
            </div>
            <div className="mt-6 space-y-6">
              {mostUsed.map((item) => (
                <div key={item.name} className="rounded-none border border-border bg-background p-4">
                  <div className="text-lg font-bold uppercase tracking-tight text-foreground">
                    {item.name}
                  </div>
                  <div className="mt-1 text-base font-bold uppercase tracking-widest text-muted-foreground">
                    {t("studentsAssigned", { count: item.count })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-base font-bold uppercase tracking-widest text-accent">
              {t("recentlyUpdated")}
            </div>
            <div className="mt-6 space-y-6">
              {recentlyUpdated.map((item) => (
                <div key={item.name} className="border-l-2 border-border pl-4">
                  <div className="text-lg font-bold uppercase tracking-tight text-foreground">
                    {item.name}
                  </div>
                  <div className="mt-1 text-base font-bold uppercase tracking-widest text-muted-foreground">
                    {item.timeKey === "date"
                      ? item.time
                      : t(`time.${item.timeKey}`, { time: item.time })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-2 border-border bg-background p-6">
            <div className="text-base font-bold uppercase tracking-widest text-muted-foreground">
              {t("globalEfficiency")}
            </div>
            <div className="mt-6 text-3xl font-bold uppercase tracking-tight text-accent">
              94.2%
            </div>
            <div className="mt-4 h-2 w-full bg-muted">
              <div className="h-full w-[94%] bg-accent" />
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
