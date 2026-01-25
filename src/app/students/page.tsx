import Link from "next/link";

import AppShell from "../components/AppShell";
import StudentGrid from "../components/StudentGrid";
import { pbList } from "@/lib/pocketbase";
import { getTranslations } from "next-intl/server";

type StudentRecord = {
  id: string;
  name: string;
  status?: string;
};

export default async function StudentsPage() {
  const t = await getTranslations("Students");
  const data = await pbList<StudentRecord>("students", { perPage: 50 });
  const students = data.items.map((student, index) => ({
    name: student.name,
    detail: student.status
      ? t("status", { status: student.status })
      : t("statusUnknown"),
    num: String(index + 1).padStart(2, "0"),
    slug: student.id,
  }));

  return (
    <AppShell>
      <div className="border-b border-border pb-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[clamp(3rem,12vw,14rem)] font-bold uppercase leading-[0.85] tracking-tighter">
              {t("title")}
            </h1>
          </div>
          <Link
            href="/students/new"
            className="inline-flex h-12 items-center border-2 border-accent bg-accent px-6 text-lg font-bold uppercase tracking-widest text-accent-foreground transition-transform duration-200 hover:scale-[1.02]"
          >
            {t("actions.addStudent")}
          </Link>
        </div>
      </div>

      <div className="flex-1 pt-10">
        {students.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-start justify-center gap-4 border-2 border-dashed border-border bg-background p-8 text-left">
            <div className="text-base font-bold uppercase tracking-widest text-muted-foreground">
              {t("empty.title")}
            </div>
            <div className="text-2xl font-bold uppercase tracking-tight text-foreground">
              {t("empty.subtitle")}
            </div>
            <Link
              href="/students/new"
              className="inline-flex h-12 items-center border-accent bg-accent px-6 text-lg font-bold uppercase tracking-widest text-accent-foreground transition-transform duration-200 hover:scale-[1.02]"
            >
              {t("actions.addStudent")}
            </Link>
          </div>
        ) : (
          <StudentGrid students={students} />
        )}
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-6 py-4 text-base font-bold uppercase tracking-widest text-muted-foreground">
        <span>{t("footer.system")}</span>
        <span className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            {t("footer.serverLive")}
          </span>
          <span>{t("footer.activeTrainers", { count: 1204 })}</span>
          <span>{t("footer.clientsSynced", { count: 18992 })}</span>
        </span>
      </footer>
    </AppShell>
  );
}
