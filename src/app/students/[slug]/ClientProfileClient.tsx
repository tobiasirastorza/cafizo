"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  RiAddLine,
  RiBarChartLine,
  RiDeleteBinLine,
  RiLoopLeftLine,
  RiLinkM,
  RiListOrdered2,
  RiUserFollowLine,
  RiUserUnfollowLine,
} from "@remixicon/react";
import AssignRoutineModal from "./AssignRoutineModal";
import { useClientProfileActivity } from "@/hooks/useClientProfileActivity";
import { formatShortDate } from "@/lib/date-format";
import { useToast } from "@/app/components/ToastProvider";
import type { ReactNode } from "react";

type Routine = {
  id: string;
  name: string;
  level?: string;
  split?: string;
  days_per_week?: number;
  mode?: "weekly" | "free";
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
  routine_id?: string;
  status: string;
  order_index?: number;
  started_at?: string;
  completed_at?: string;
  ended_at?: string;
  expand?: {
    routine_id?: Routine;
  };
};

interface ClientProfileClientProps {
  student: Student;
  activeAssignment: StudentRoutine | null;
  availableRoutines: Routine[];
  exerciseCompletions: ExerciseCompletion[];
  routineAssignments: StudentRoutine[];
  slug: string;
}

const PB_BASE = "http://35.209.214.205:8090/api";

function formatTime(dateStr: string | undefined, locale: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ActionButtonProps = {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  tone?: "neutral" | "accent" | "danger";
};

function ActionButton({
  label,
  icon,
  onClick,
  href,
  disabled = false,
  tone = "neutral",
}: ActionButtonProps) {
  const toneClasses =
    tone === "accent"
      ? "border-accent bg-accent text-accent-foreground hover:bg-accent/90"
      : tone === "danger"
        ? "border-error text-error hover:bg-error/10 bg-background-card"
        : "border-border bg-background-card text-foreground hover:bg-background-muted";

  const content = (
    <>
      <span className="pointer-events-none absolute -top-11 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background shadow-sm group-hover:block group-focus-within:block">
        {label}
        <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-foreground" />
      </span>
      <span
        aria-hidden="true"
        className={`inline-flex h-11 w-11 items-center justify-center rounded-md border transition-colors duration-150 ${toneClasses} ${disabled ? "opacity-60" : ""}`}
      >
        {icon}
      </span>
    </>
  );

  if (href) {
    return (
      <div className="group relative">
        <Link
          href={href}
          aria-label={label}
          className="block rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {content}
        </Link>
      </div>
    );
  }

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className="block rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed"
      >
        {content}
      </button>
    </div>
  );
}

export default function ClientProfileClient({
  student,
  activeAssignment,
  availableRoutines,
  exerciseCompletions,
  routineAssignments,
  slug,
}: ClientProfileClientProps) {
  const t = useTranslations("ClientProfile");
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"routines" | "progress">("routines");
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [isSwitchingRoutine, setIsSwitchingRoutine] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isInactive = (student.status ?? "").toLowerCase() === "inactive";
  const activeRoutine = activeAssignment?.expand?.routine_id ?? null;
  const {
    isModalOpen,
    setIsModalOpen,
    sortedCompletions,
    groupedByDate,
    activeRoutineMeta,
  } = useClientProfileActivity(activeRoutine, exerciseCompletions);
  const sortedAssignments = useMemo(() => {
    const statusWeight: Record<string, number> = {
      active: 0,
      pending: 1,
      completed: 2,
      cancelled: 3,
    };

    return [...routineAssignments].sort((a, b) => {
      const statusDiff = (statusWeight[a.status] ?? 99) - (statusWeight[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;

      const orderA = a.order_index ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order_index ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;

      const startedA = a.started_at ? new Date(a.started_at).getTime() : 0;
      const startedB = b.started_at ? new Date(b.started_at).getTime() : 0;
      return startedB - startedA;
    });
  }, [routineAssignments]);
  const assignedRoutineIds = useMemo(
    () =>
      routineAssignments
        .filter((assignment) => assignment.status === "active" || assignment.status === "pending")
        .map((assignment) => assignment.routine_id ?? assignment.expand?.routine_id?.id)
        .filter((id): id is string => Boolean(id)),
    [routineAssignments],
  );
  const nextOrderIndex = useMemo(() => {
    const highestOrder = routineAssignments.reduce((max, assignment) => {
      if (typeof assignment.order_index !== "number") return max;
      return Math.max(max, assignment.order_index);
    }, 0);

    return highestOrder + 1;
  }, [routineAssignments]);

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

  const handleCopyAccessLink = async () => {
    setIsCopyingLink(true);
    try {
      const url = `${window.location.origin}/pwa?student=${slug}`;
      await navigator.clipboard.writeText(url);
      toast.success(t("actions.copiedAccessLink"));
    } catch {
      toast.error(t("errors.copyAccessLinkFailed"));
    } finally {
      setIsCopyingLink(false);
    }
  };

  const handleActivateRoutine = async (assignment: StudentRoutine) => {
    if (assignment.status === "active") return;

    setIsSwitchingRoutine(true);
    try {
      const now = new Date().toISOString();
      const activeAssignments = routineAssignments.filter((entry) => entry.status === "active");

      const deactivateRequests = activeAssignments
        .filter((entry) => entry.id !== assignment.id)
        .map((entry) =>
          fetch(`${PB_BASE}/collections/student_routines/records/${entry.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "pending",
            }),
          }),
        );

      const activateRequest = fetch(
        `${PB_BASE}/collections/student_routines/records/${assignment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "active",
            started_at: assignment.started_at ?? now,
            completed_at: null,
            ended_at: null,
          }),
        },
      );

      const responses = await Promise.all([...deactivateRequests, activateRequest]);
      if (responses.some((response) => !response.ok)) {
        throw new Error(t("errors.changeRoutineFailed"));
      }

      toast.success(t("actions.changedRoutine"));
      router.refresh();
    } catch {
      toast.error(t("errors.changeRoutineFailed"));
    } finally {
      setIsSwitchingRoutine(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t("actions.deleteConfirm"));
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `${PB_BASE}/collections/students/records/${slug}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        throw new Error(t("errors.deleteFailed"));
      }

      toast.success(t("actions.deleted"));
      router.push("/students");
    } catch {
      toast.error(t("errors.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return t("routineStatus.active");
      case "pending":
        return t("routineStatus.pending");
      case "completed":
        return t("routineStatus.completed");
      case "cancelled":
        return t("routineStatus.cancelled");
      default:
        return status;
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "active":
        return "border-accent/30 bg-accent/10 text-accent";
      case "pending":
        return "border-border bg-background-muted text-foreground-secondary";
      case "completed":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "cancelled":
        return "border-border bg-background-muted text-foreground-muted";
      default:
        return "border-border bg-background-muted text-foreground-secondary";
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

          <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:justify-end">
            {!isInactive && activeRoutine ? (
              <ActionButton
                href={`/students/${slug}/workouts`}
                label={t("viewWorkouts")}
                icon={<RiBarChartLine size={18} aria-hidden="true" />}
              />
            ) : null}
            {!isInactive ? (
              <ActionButton
                onClick={() => setIsModalOpen(true)}
                label={activeRoutine ? t("actions.changeRoutine") : t("actions.assign")}
                icon={<RiAddLine size={18} aria-hidden="true" />}
                tone="accent"
              />
            ) : null}
            <ActionButton
              onClick={() => void handleCopyAccessLink()}
              disabled={isCopyingLink || isDeactivating}
              label={isCopyingLink ? t("actions.copyingLink") : t("actions.copyAccessLink")}
              icon={<RiLinkM size={18} aria-hidden="true" />}
            />
            <ActionButton
              onClick={() => handleSetStatus(isInactive ? "active" : "inactive")}
              disabled={isDeactivating}
              label={
                isDeactivating
                  ? isInactive
                    ? t("actions.markingActive")
                    : t("actions.markingInactive")
                  : isInactive
                    ? t("actions.markActive")
                    : t("actions.markInactive")
              }
              icon={
                isInactive ? (
                  <RiUserFollowLine size={18} aria-hidden="true" />
                ) : (
                  <RiUserUnfollowLine size={18} aria-hidden="true" />
                )
              }
              tone={isInactive ? "accent" : "danger"}
            />
            <ActionButton
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              label={isDeleting ? t("actions.deleting") : t("actions.delete")}
              icon={<RiDeleteBinLine size={18} aria-hidden="true" />}
              tone="danger"
            />
          </div>
        </div>
      </section>

      <section className="border border-border bg-background-card p-5 rounded-lg md:p-6">
        <div className="border-b border-border pb-3">
          <div
            className="inline-flex rounded-md border border-border bg-background-card p-1"
            role="tablist"
            aria-label={t("sectionTabs.aria")}
          >
            {([
              { key: "routines", label: t("sectionTabs.routines") },
              { key: "progress", label: t("sectionTabs.progress") },
            ] as const).map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-background-active text-foreground"
                      : "text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "routines" ? (
          <>
            <div className="mt-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                {t("assignedRoutinesTitle")}
              </h2>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-foreground-muted">
                <RiListOrdered2 size={16} aria-hidden="true" />
                {t("assignedRoutinesCount", { count: sortedAssignments.length })}
              </div>
            </div>

            {sortedAssignments.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-border px-4 py-5 text-sm text-foreground-secondary">
                {t("noAssignedRoutines")}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {sortedAssignments.map((assignment) => {
                  const routine = assignment.expand?.routine_id;
                  if (!routine) return null;

                  return (
                    <div
                      key={assignment.id}
                      className="rounded-lg border border-border bg-background-card p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-medium text-foreground">
                              {routine.name}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] ${getStatusClasses(assignment.status)}`}
                            >
                              {getStatusLabel(assignment.status)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.08em] text-foreground-muted">
                            {[
                              routine.level?.trim() ? routine.level.toUpperCase() : null,
                              routine.mode === "free"
                                ? t("routineMode.free")
                                : typeof routine.days_per_week === "number"
                                  ? t("routineMode.weeklyDays", { count: routine.days_per_week })
                                  : t("routineMode.weekly"),
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                          {(assignment.started_at || assignment.completed_at || assignment.ended_at) && (
                            <div className="mt-2 text-xs text-foreground-secondary">
                              {assignment.started_at
                                ? t("routineDates.started", {
                                    date: formatShortDate(assignment.started_at, locale),
                                  })
                                : null}
                              {assignment.completed_at
                                ? ` • ${t("routineDates.completed", {
                                    date: formatShortDate(assignment.completed_at, locale),
                                  })}`
                                : null}
                              {assignment.ended_at && !assignment.completed_at
                                ? ` • ${t("routineDates.ended", {
                                    date: formatShortDate(assignment.ended_at, locale),
                                  })}`
                                : null}
                            </div>
                          )}
                        </div>

                        {!isInactive && assignment.status !== "active" ? (
                          <button
                            type="button"
                            onClick={() => void handleActivateRoutine(assignment)}
                            disabled={isSwitchingRoutine}
                            className="inline-flex h-10 items-center justify-center gap-2 border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted disabled:opacity-60"
                          >
                            <RiLoopLeftLine size={16} aria-hidden="true" />
                            {isSwitchingRoutine
                              ? t("actions.changingRoutine")
                              : t("actions.makeActive")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <section className="mt-4 min-h-[300px]">
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
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
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
                                {completion.sets ?? "—"} sets
                              </span>
                              <span className="text-foreground-secondary">
                                {completion.reps ?? "—"} reps
                              </span>
                              <span className="text-foreground-secondary">
                                {completion.weight != null ? `${completion.weight}kg` : "— kg"}
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
        )}
      </section>

      <AssignRoutineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        studentId={slug}
        routines={availableRoutines}
        assignedRoutineIds={assignedRoutineIds}
        hasActiveRoutine={Boolean(activeAssignment)}
        nextOrderIndex={nextOrderIndex}
      />
    </>
  );
}
