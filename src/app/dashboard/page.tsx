import AppShell from "../components/AppShell";
import { getTranslations } from "next-intl/server";

const marqueeItems = [
  { name: "Marcus Reed", key: "missedSessions", count: 3 },
  { name: "Sarah Chen", key: "stalledProgress", detail: "bench" },
  { name: "Alex Stevens", key: "programEndingSoon" },
  { name: "Jenna Ortega", key: "prStreak", count: 6 },
];

const stats = [
  { key: "activeClients", value: "42", delta: "+4" },
  { key: "sessionsThisWeek", value: "128", delta: "" },
  { key: "adherence", value: "88", delta: "%" },
];

const sessions = [
  {
    time: "09:00",
    name: "Alex Stevens",
    focusKey: "hypertrophyLowerA",
  },
  {
    time: "10:30",
    name: "Mike Jordans",
    focusKey: "strengthCompoundPull",
  },
  {
    time: "13:00",
    name: "Jenna Ortega",
    focusKey: "mobilityRecoveryFlow",
  },
  {
    time: "15:30",
    name: "Brad Pitt",
    focusKey: "enduranceMetcon30",
  },
  {
    time: "17:00",
    name: "Tom Hardy",
    focusKey: "powerExplosiveLifting",
  },
];

const alerts = [
  {
    titleKey: "stalledProgress",
    detailKey: "stalledProgressDetail",
    actionKey: "reviewData",
    tone: "accent",
  },
  {
    titleKey: "programEnding",
    detailKey: "programEndingDetail",
    actionKey: "buildPhase",
    tone: "muted",
  },
  {
    titleKey: "missedSessions",
    detailKey: "missedSessionsDetail",
    actionKey: "sendAlert",
    tone: "danger",
  },
];

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard");

  return (
    <AppShell>
      <section className="overflow-hidden border border-border bg-accent text-accent-foreground">
        <div className="marquee flex w-[200%] items-center">
          {[0, 1].map((group) => (
            <div
              key={`marquee-${group}`}
              className="flex w-1/2 items-center gap-6 px-5 py-2 text-sm font-bold uppercase tracking-widest"
            >
              {marqueeItems.map((item) => (
                <div key={`${group}-${item.name}-${item.key}`} className="flex items-center gap-8">
                  <span>
                    {t(`marquee.${item.key}`, {
                      name: item.name,
                      count: item.count,
                      detail: item.detail,
                    })}
                  </span>
                  <span aria-hidden="true">•</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-px border border-border bg-border md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.key} className="bg-background p-6 md:p-8">
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {t(`stats.${stat.key}`)}
            </div>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-[2.75rem] font-bold uppercase leading-none tracking-tighter text-accent md:text-[3.5rem]">
                {stat.value}
              </span>
              {stat.delta ? (
                <span className="text-sm font-bold uppercase tracking-widest text-foreground">
                  {stat.delta}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </section>
      <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="flex items-end justify-between border-b border-border pb-3">
            <h2 className="text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl">
              {t("todaysSessions")}
            </h2>
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {t("sessionsDate")}
            </span>
          </div>
          <div className="divide-y divide-border">
            {sessions.map((session) => (
              <div
                key={`${session.time}-${session.name}`}
                className="flex flex-wrap items-center gap-5 py-6"
              >
                <div className="min-w-[80px] text-[2rem] font-bold uppercase leading-none text-muted md:text-[2.5rem]">
                  {session.time}
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold uppercase tracking-tight text-foreground">
                    {session.name}
                  </div>
                  <div className="mt-1 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    {t(`sessionFocus.${session.focusKey}`)}
                  </div>
                </div>
                <button className="h-10 border-2 border-border px-4 text-sm font-bold uppercase tracking-widest text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background">
                  {t("logSession")}
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="border-b border-border pb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {t("trainerAlerts")}
          </div>
          {alerts.map((alert) => {
            const toneStyles =
              alert.tone === "accent"
                ? "border-accent text-accent"
                : alert.tone === "danger"
                  ? "border-red-500 text-red-500"
                  : "border-border text-foreground";
            return (
              <div
                key={alert.titleKey}
                className={`border-2 ${toneStyles} bg-background p-5 text-foreground`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wide text-foreground">
                      {t(`alerts.${alert.titleKey}.title`)}
                    </div>
                    <div className="mt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      {t(`alerts.${alert.titleKey}.detail`)}
                    </div>
                  </div>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center border-2 ${toneStyles}`}
                    aria-hidden="true"
                  >
                    !
                  </span>
                </div>
                <button className="mt-4 text-sm font-bold uppercase tracking-widest text-foreground transition-colors duration-200 hover:text-accent">
                  {t(`alerts.${alert.titleKey}.action`)}
                </button>
              </div>
            );
          })}

          <div className="border-2 border-border bg-background p-5">
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {t("weeklyVolumeTrend")}
            </div>
            <div className="mt-4 flex h-32 items-end gap-3">
              {[30, 48, 70, 90, 60, 82, 52].map((height, index) => (
                <div
                  key={`bar-${height}-${index}`}
                  className={`w-6 ${index === 3 ? "bg-accent" : "bg-muted"}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
