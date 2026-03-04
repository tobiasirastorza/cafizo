import AppShell from "../components/AppShell";
import { getLocale } from "next-intl/server";
import DashboardClient from "./DashboardClient";
import { getDashboardData } from "./data";

export default async function DashboardPage() {
  const locale = await getLocale();
  const { marqueeItems, stats, recentSessions, alerts } =
    await getDashboardData(locale);

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col">
        <DashboardClient
          marqueeItems={marqueeItems}
          stats={stats}
          recentSessions={recentSessions}
          alerts={alerts}
        />
      </div>
    </AppShell>
  );
}
