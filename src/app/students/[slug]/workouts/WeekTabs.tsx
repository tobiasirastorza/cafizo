"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/app/components/ToastProvider";
import { buildPocketBaseUrl } from "@/hooks/useRoutineProgress";

type Entry = {
  id: string;
  exerciseName: string;
  muscleGroup?: string;
  sets?: number;
  reps?: string;
  weight?: number;
  status: "completed" | "skipped";
};

type WeekData = {
  weekKey: string;
  weekLabel: string;
  entries: Entry[];
};

type WeekTabsProps = {
  studentId: string;
  currentWeekKey: string;
  data: WeekData[];
};

export function WeekTabs({ studentId, currentWeekKey, data }: WeekTabsProps) {
  const t = useTranslations("Workouts");
  const toast = useToast();
  const router = useRouter();
  const [activeWeekKey, setActiveWeekKey] = useState(data[0]?.weekKey ?? "");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-week-menu-root='true']")) return;
      setOpenMenuId(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openMenuId]);

  const activeData = data.find((d) => d.weekKey === activeWeekKey);
  const entries = activeData?.entries ?? [];
  const completedCount = entries.filter((e) => e.status === "completed").length;
  const skippedCount = entries.filter((e) => e.status === "skipped").length;

  const handleDelete = async (entryId: string, week: string) => {
    setDeletingId(entryId);
    setOpenMenuId(null);
    try {
      const res = await fetch(
        buildPocketBaseUrl(`/collections/exercise_completions/records/${entryId}`),
        { method: "DELETE" },
      );
      if (!res.ok && res.status !== 404) throw new Error(t("errors.deleteFailed"));
      toast.success(t("actions.deleteSuccess"));
      router.refresh();
    } catch {
      toast.error(t("errors.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-10">
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {data.map((week) => (
          <button
            key={week.weekKey}
            onClick={() => setActiveWeekKey(week.weekKey)}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-[0.08em] transition-colors duration-150 rounded-md ${
              activeWeekKey === week.weekKey
                ? "bg-background-active text-foreground"
                : "border border-border bg-background-card text-foreground-secondary hover:bg-background-muted hover:text-foreground"
            }`}
          >
            {week.weekLabel}
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-4 text-sm">
        <span className="text-accent font-medium">
          {t("stats.completed", { count: completedCount })}
        </span>
        {skippedCount > 0 && (
          <span className="text-foreground-secondary">
            {t("stats.skipped", { count: skippedCount })}
          </span>
        )}
      </div>

      <div className="mt-6 border border-border rounded-lg overflow-visible">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={`grid gap-4 p-4 md:grid-cols-[minmax(0,2fr)_100px_100px_100px_110px_44px] ${
              index % 2 === 0 ? "bg-background-card" : "bg-background-muted/30"
            } ${index !== entries.length - 1 ? "border-b border-border" : ""}`}
          >
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("table.exercise")}
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.exerciseName}
              </div>
              {entry.muscleGroup && (
                <div className="mt-1 text-xs uppercase tracking-[0.08em] text-foreground-muted">
                  {entry.muscleGroup}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("table.sets")}
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.sets ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("table.reps")}
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.reps ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("table.weight")}
              </div>
              <div className="mt-1 text-base font-medium text-foreground">
                {entry.weight ? `${entry.weight}kg` : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                {t("table.status")}
              </div>
              <div
                className={`mt-1 text-sm font-medium ${
                  entry.status === "completed"
                    ? "text-accent"
                    : "text-foreground-secondary"
                }`}
              >
                {entry.status === "completed" ? t("status.completed") : t("status.skipped")}
              </div>
            </div>

            <div
              data-week-menu-root="true"
              className="relative flex items-start justify-end"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mt-6">
                <button
                  type="button"
                  aria-label={t("actions.openMenu")}
                  onClick={() =>
                    setOpenMenuId((prev) => (prev === entry.id ? null : entry.id))
                  }
                  className="inline-flex h-8 w-8 items-center justify-center border border-border bg-background-card text-base font-semibold leading-none text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                >
                  ⋮
                </button>
              </div>

              {openMenuId === entry.id ? (
                <div className="absolute right-0 top-16 z-20 w-44 border border-border bg-background-card rounded-md">
                  <button
                    type="button"
                    disabled
                    className="flex h-10 w-full items-center px-3 text-left text-sm text-foreground-muted cursor-not-allowed border-b border-border-subtle"
                  >
                    {t("actions.editUnavailable")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id, activeWeekKey)}
                    disabled={deletingId === entry.id}
                    className="flex h-10 w-full items-center px-3 text-left text-sm text-error transition-colors duration-150 hover:bg-background-muted border-b border-border-subtle disabled:opacity-60"
                  >
                    {deletingId === entry.id ? t("actions.deleting") : t("actions.deleteLog")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(null)}
                    className="flex h-10 w-full items-center px-3 text-left text-sm text-foreground-secondary transition-colors duration-150 hover:bg-background-muted"
                  >
                    {t("actions.closeMenu")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
