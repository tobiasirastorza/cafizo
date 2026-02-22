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
        <div className="flex flex-row flex-wrap items-center justify-between gap-6">
          <h1 className="text-2xl font-semibold uppercase leading-tight tracking-tight md:text-3xl">
            {t("title")}
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-10 items-center border border-accent bg-accent px-4 text-sm font-medium uppercase tracking-[0.08em] text-accent-foreground transition-colors duration-150 hover:bg-accent/90 rounded-md"
          >
            + {t("actions.addClient")}
          </button>
        </div>
      </div>

      <div className="flex-1 pt-10">
        {students.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-start justify-center gap-4 border border-dashed border-border bg-background-card p-8 text-left rounded-lg">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
              {t("empty.title")}
            </div>
            <div className="text-xl font-semibold text-foreground">
              {t("empty.subtitle")}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex h-10 items-center border border-accent bg-accent px-4 text-sm font-medium uppercase tracking-[0.08em] text-accent-foreground transition-colors duration-150 hover:bg-accent/90 rounded-md"
            >
              {t("actions.addClient")}
            </button>
          </div>
        ) : (
          <StudentGrid students={students} />
        )}
      </div>

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </AppShell>
  );
}
