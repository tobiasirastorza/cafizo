"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";
import StudentGrid from "../components/StudentGrid";
import AddStudentModal from "./AddStudentModal";
import { useTranslations } from "next-intl";

interface StudentsPageProps {
  students: Array<{
    name: string;
    detail: string;
    num: string;
    slug: string;
    status: string;
  }>;
}

export default function StudentsPageClient({ students }: StudentsPageProps) {
  const t = useTranslations("Clients");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");
  const [query, setQuery] = useState("");

  const filteredStudents = students
    .filter((student) => {
      if (activeTab === "all") return true;
      if (activeTab === "active") return student.status === "active";
      return student.status === "inactive";
    })
    .filter((student) =>
      student.name.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .map((student, index) => ({
      ...student,
      num: String(index + 1).padStart(2, "0"),
    }));

  const tabCount = {
    all: students.length,
    active: students.filter((student) => student.status === "active").length,
    inactive: students.filter((student) => student.status === "inactive").length,
  };

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

        <div className="mt-6 inline-flex w-full rounded-md border border-border bg-background-card p-1 md:w-auto">
          {(["all", "active", "inactive"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded px-3 py-2 text-xs font-medium uppercase tracking-[0.08em] transition-all duration-150 md:flex-none ${
                activeTab === tab
                  ? "bg-background-active text-foreground"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {t(`tabs.${tab}`)} ({tabCount[tab]})
            </button>
          ))}
        </div>

        <div className="mt-4 max-w-md">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search.placeholder")}
            className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="flex-1 pt-10">
        {filteredStudents.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-start justify-center gap-4 border border-dashed border-border bg-background-card p-8 text-left rounded-lg">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
              {t("empty.title")}
            </div>
            <div className="text-xl font-semibold text-foreground">
              {query.trim() ? t("search.empty") : t("empty.subtitle")}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className={`inline-flex h-10 items-center border px-4 text-sm font-medium uppercase tracking-[0.08em] transition-colors duration-150 rounded-md ${
                activeTab === "inactive"
                  ? "border-border bg-background-card text-foreground-secondary"
                  : "border-accent bg-accent text-accent-foreground hover:bg-accent/90"
              }`}
              disabled={activeTab === "inactive"}
            >
              {t("actions.addClient")}
            </button>
          </div>
        ) : (
          <StudentGrid students={filteredStudents} />
        )}
      </div>

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </AppShell>
  );
}
