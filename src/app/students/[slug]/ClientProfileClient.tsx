"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  RiAddLine,
  RiBarChartLine,
  RiUserFollowLine,
  RiUserUnfollowLine,
} from "@remixicon/react";
import AssignRoutineModal from "./AssignRoutineModal";
import { useClientProfileActivity } from "@/hooks/useClientProfileActivity";
import { formatShortDate } from "@/lib/date-format";
import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type Routine = {
  id: string;
  name: string;
  level?: string;
  split?: string;
  days_per_week?: number;
};

type Student = {
  id: string;
  name: string;
  status?: string;
  phone?: string;
  created?: string;
};

type ExerciseCompletion = {
  id: string;
  completed_at: string;
  status: string;
  sets?: number;
  reps?: string;
  weight?: number;
  expand?: {
    routine_exercise_id?: {
      expand?: {
        exercise_id?: {
          name: string;
          muscle_group?: string;
        };
      };
    };
  };
};

type StudentRoutine = {
  id: string;
  status: string;
  progress_current: number;
  progress_total: number;
  started_at?: string;
  completed_at?: string;
  expand?: {
    routine_id?: Routine;
  };
};

interface ClientProfileClientProps {
  student: Student;
  activeRoutine: Routine | null;
  availableRoutines: Routine[];
  exerciseCompletions: ExerciseCompletion[];
  routineHistory: StudentRoutine[];
  slug: string;
}

const PB_BASE = "https://pb.barrani.app/api";

function formatTime(dateStr: string | undefined, locale: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClientProfileClient({
  student,
  activeRoutine,
  availableRoutines,
  exerciseCompletions,
  slug,
}: ClientProfileClientProps) {
  const t = useTranslations("ClientProfile");
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const isInactive = (student.status ?? "").toLowerCase() === "inactive";
  const {
    isModalOpen,
    setIsModalOpen,
    sortedCompletions,
    groupedByDate,
    activeRoutineMeta,
  } = useClientProfileActivity(activeRoutine, exerciseCompletions);

  const handleSetStatus = async (nextStatus: "active" | "inactive") => {
    setIsDeactivating(true);
    try {
      const res = await fetch(`${PB_BASE}/collections/students/records/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error(
          t(
            nextStatus === "inactive"
              ? "errors.markInactiveFailed"
              : "errors.markActiveFailed",
          ),
        );
      }

      toast.success(
        t(
          nextStatus === "inactive"
            ? "actions.markedInactive"
            : "actions.markedActive",
        ),
      );
      router.refresh();
    } catch {
      toast.error(
        t(
          nextStatus === "inactive"
            ? "errors.markInactiveFailed"
            : "errors.markActiveFailed",
        ),
      );
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <>
      <section className="border-b border-border pb-6">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors duration-150 hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          {t("back")}
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold uppercase leading-tight tracking-tight text-foreground md:text-3xl">
            {student.name}
          </h1>
        </div>
      </section>

      <section className="border border-border bg-background-card p-5 rounded-lg md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-accent">
              {activeRoutine ? t("activeProgram") : t("noActiveProgram")}
            </div>
            <h2 className="mt-2 text-xl font-semibold text-foreground md:text-2xl">
              {activeRoutine?.name ?? t("noRoutineAssigned")}
            </h2>
            {activeRoutine && (
              <div className="mt-1 text-xs uppercase tracking-[0.08em] text-foreground-muted">
                {activeRoutineMeta}
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto">
            {!isInactive && activeRoutine ? (
              <Link
                href={`/students/${slug}/workouts`}
                className="inline-flex h-10 items-center justify-center gap-2 border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
              >
                <RiBarChartLine size={16} aria-hidden="true" />
                {t("viewWorkouts")}
              </Link>
            ) : !isInactive ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90"
              >
                <RiAddLine size={16} aria-hidden="true" />
                {t("actions.assign")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => handleSetStatus(isInactive ? "active" : "inactive")}
              disabled={isDeactivating}
              className={`inline-flex h-10 items-center justify-center gap-2 border bg-background-card px-4 text-sm font-medium rounded-md transition-colors duration-150 disabled:opacity-60 ${
                isInactive
                  ? "border-accent text-accent hover:bg-accent/10"
                  : "border-error text-error hover:bg-error/10"
              }`}
            >
              {isInactive ? (
                <RiUserFollowLine size={16} aria-hidden="true" />
              ) : (
                <RiUserUnfollowLine size={16} aria-hidden="true" />
              )}
              {isDeactivating
                ? isInactive
                  ? t("actions.markingActive")
                  : t("actions.markingInactive")
                : isInactive
                  ? t("actions.markActive")
                  : t("actions.markInactive")}
            </button>
          </div>
        </div>
      </section>

      <section className="min-h-[300px]">
        <div className="space-y-4">
          {sortedCompletions.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-base font-semibold text-foreground">No activity yet</div>
              <div className="mt-2 text-sm text-foreground-secondary">
                {activeRoutine
                  ? "This client hasn't logged any exercises yet."
                  : "Assign a routine to start tracking activity."}
              </div>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([date, completions]) => (
              <div key={date} className="border-l-2 border-accent pl-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="-ml-[21px] h-3 w-3 rounded-full bg-accent" />
                  <div className="text-sm font-medium uppercase tracking-[0.08em] text-accent">
                    {formatShortDate(date, locale)}
                  </div>
                  <div className="text-xs text-foreground-secondary">
                    {completions.length} exercises
                  </div>
                </div>

                <div className="space-y-2">
                  {completions.map((completion) => {
                    const exercise =
                      completion.expand?.routine_exercise_id?.expand?.exercise_id;
                    return (
                      <div
                        key={completion.id}
                        className="border border-border bg-background-card px-3 py-2 rounded-md"
                      >
                        <div className="grid grid-cols-[56px_minmax(0,1fr)_52px_52px_72px] items-center gap-2 text-xs">
                          <span className="font-medium text-foreground-secondary">
                            {formatTime(completion.completed_at, locale)}
                          </span>
                          <span
                            className={`truncate font-medium ${
                              completion.status === "completed"
                                ? "text-foreground"
                                : "text-foreground-secondary"
                            }`}
                          >
                            {exercise?.name ?? "Unknown"}
                          </span>
                          <span className="text-foreground-secondary">
                            {completion.sets ?? "—"}
                          </span>
                          <span className="text-foreground-secondary">
                            {completion.reps ?? "—"}
                          </span>
                          <span className="text-foreground-secondary">
                            {completion.weight != null ? `${completion.weight}kg` : "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <AssignRoutineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        studentId={slug}
        routines={availableRoutines}
      />
    </>
  );
}
