"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";
import StudentGrid from "../components/StudentGrid";
import AddStudentModal from "./AddStudentModal";
import { useTranslations } from "next-intl";

interface Student {
  id: string;
  name: string;
  status?: string;
}

interface StudentsPageProps {
  students: Array<{
    name: string;
    detail: string;
    num: string;
    slug: string;
  }>;
}

export default function StudentsPageClient({ students }: StudentsPageProps) {
  const t = useTranslations("Clients");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <AppShell>
      <div>
        <div className="flex flex-col flex-wrap items-start justify-between gap-6">
          <h1 className="text-[clamp(3rem,10vw,8rem)] font-bold uppercase leading-[0.85] tracking-tighter">
            {t("title")}
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-12 items-center border-2 border-accent bg-accent px-6 text-lg font-bold uppercase tracking-widest text-accent-foreground transition-transform duration-200 hover:scale-[1.02]"
          >
            + {t("actions.addClient")}
          </button>
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-12 items-center border-accent bg-accent px-6 text-lg font-bold uppercase tracking-widest text-accent-foreground transition-transform duration-200 hover:scale-[1.02]"
            >
              {t("actions.addClient")}
            </button>
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

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </AppShell>
  );
}
