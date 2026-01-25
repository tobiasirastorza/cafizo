import AppShell from "../components/AppShell";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const t = await getTranslations("Settings");

  return (
    <AppShell>
      <div className="border-b border-border pb-12">
        <h1 className="text-[clamp(3rem,12vw,14rem)] font-bold uppercase leading-[0.85] tracking-tighter">
          {t("title")}
        </h1>
      </div>
      <div className="grid gap-8 py-12">
        <div className="flex items-center justify-center text-lg font-medium text-muted-foreground">
          {t("empty")}
        </div>
      </div>
    </AppShell>
  );
}
