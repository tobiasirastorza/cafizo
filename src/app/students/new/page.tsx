import Link from "next/link";
import AppShell from "../../components/AppShell";
import NewStudentForm from "./NewStudentForm";
import { pbList } from "@/lib/pocketbase";
import { getTranslations } from "next-intl/server";

type ExerciseRecord = {
  id: string;
  name: string;
  muscle_group?: string;
  exercise_type?: string;
};

export default async function NewStudentPage() {
  const data = await pbList<ExerciseRecord>("exercises", { perPage: 200 });
  const t = await getTranslations("NewStudent");

  return (
    <AppShell>
      <section className="-mx-4 md:-mx-6 -mt-8 md:-mt-6">
        <div className="border border-border bg-background">
          <header className="border-b border-border px-6 py-6 md:px-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.45em] text-muted-foreground">
                  {t("newOnboarding")}
                </div>
                <div className="mt-3 text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
                  {t("title")}
                </div>
              </div>
              <Link
                href="/students"
                className="inline-flex h-11 items-center border-2 border-border px-6 text-sm font-bold uppercase tracking-[0.25em] text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background"
              >
                {t("goBack")}
              </Link>
            </div>
          </header>
          <NewStudentForm exercises={data.items} />
        </div>
      </section>
    </AppShell>
  );
}
