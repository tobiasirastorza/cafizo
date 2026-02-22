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
      <DashboardClient
        marqueeItems={marqueeItems}
        stats={stats}
        recentSessions={recentSessions}
        alerts={alerts}
      />
    </AppShell>
  );
}
