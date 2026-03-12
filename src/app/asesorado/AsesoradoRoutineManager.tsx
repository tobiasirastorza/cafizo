"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiAddLine, RiLoopLeftLine } from "@remixicon/react";

import { useToast } from "@/app/components/ToastProvider";
import AssignRoutineModal from "@/app/students/[slug]/AssignRoutineModal";

const PB_BASE = "https://pb.barrani.app/api";

type Routine = {
  id: string;
  name: string;
  level?: string;
  split?: string;
  days_per_week?: number;
  mode?: "weekly" | "free";
};

type StudentRoutine = {
  id: string;
  routine_id: string;
  status: string;
  order_index?: number;
  started_at?: string;
  completed_at?: string;
  ended_at?: string;
  expand?: {
    routine_id?: Routine;
  };
};

type AsesoradoRoutineManagerProps = {
  studentId: string;
  availableRoutines: Routine[];
  routineAssignments: StudentRoutine[];
};

export default function AsesoradoRoutineManager({
  studentId,
  availableRoutines,
  routineAssignments,
}: AsesoradoRoutineManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null);

  const activeAssignment = useMemo(
    () => routineAssignments.find((assignment) => assignment.status === "active") ?? null,
    [routineAssignments],
  );

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
      return orderA - orderB;
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

  const refreshCurrentView = () => {
    const params = new URLSearchParams(searchParams.toString());
    const query = params.toString();
    router.push(query ? `/asesorado?${query}` : "/asesorado");
    router.refresh();
  };

  const handleActivateRoutine = async (assignment: StudentRoutine) => {
    if (assignment.status === "active") return;

    setPendingAssignmentId(assignment.id);
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
        throw new Error("change_failed");
      }

      toast.success("Rutina activa actualizada.");
      refreshCurrentView();
    } catch {
      toast.error("No se pudo cambiar la rutina activa.");
    } finally {
      setPendingAssignmentId(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activa";
      case "pending":
        return "Pendiente";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90"
        >
          <RiAddLine size={16} aria-hidden="true" />
          {activeAssignment ? "Agregar rutina" : "Asignar rutina"}
        </button>
      </div>

      {sortedAssignments.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          {sortedAssignments.map((assignment) => {
            const routine = assignment.expand?.routine_id;
            if (!routine) return null;

            return (
              <div
                key={assignment.id}
                className="rounded-md border border-border bg-background p-3"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{routine.name}</span>
                      <span className="rounded-[4px] bg-background-muted px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-secondary">
                        {getStatusLabel(assignment.status)}
                      </span>
                      {typeof assignment.order_index === "number" ? (
                        <span className="text-[11px] uppercase tracking-[0.08em] text-foreground-muted">
                          Orden {assignment.order_index}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-foreground-secondary">
                      {routine.mode === "free"
                        ? "Rutina libre"
                        : `${routine.days_per_week ?? "-"} días/semana`}
                    </div>
                  </div>

                  {assignment.status !== "active" ? (
                    <button
                      type="button"
                      onClick={() => void handleActivateRoutine(assignment)}
                      disabled={pendingAssignmentId === assignment.id}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background-card px-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-background-muted disabled:opacity-60"
                    >
                      <RiLoopLeftLine size={16} aria-hidden="true" />
                      {pendingAssignmentId === assignment.id ? "Cambiando..." : "Activar"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <AssignRoutineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        studentId={studentId}
        routines={availableRoutines}
        assignedRoutineIds={assignedRoutineIds}
        hasActiveRoutine={Boolean(activeAssignment)}
        nextOrderIndex={nextOrderIndex}
      />
    </>
  );
}
