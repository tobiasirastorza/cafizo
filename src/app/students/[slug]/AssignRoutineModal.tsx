"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Routine = {
  id: string;
  name: string;
  level?: string;
  split?: string;
  days_per_week?: number;
};

const PB_BASE = "https://pb.barrani.app/api";

function buildUrl(path: string) {
  return `${PB_BASE}${path}`;
}

interface AssignRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  routines: Routine[];
}

export default function AssignRoutineModal({
  isOpen,
  onClose,
  studentId,
  routines,
}: AssignRoutineModalProps) {
  const t = useTranslations("ClientProfile");
  const router = useRouter();
  const [selectedRoutineId, setSelectedRoutineId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const metaLine = (routine: Routine) => {
    const parts: string[] = [];
    if (routine.level?.trim()) parts.push(routine.level.toUpperCase());
    if (
      routine.split?.trim() &&
      routine.split.trim().toLowerCase() !== routine.name.trim().toLowerCase()
    ) {
      parts.push(routine.split.toUpperCase());
    }
    if (typeof routine.days_per_week === "number") {
      parts.push(`${routine.days_per_week} days/week`);
    }
    return parts.join(" • ");
  };

  const handleSubmit = async () => {
    setError(null);

    if (!selectedRoutineId) {
      setError(t("errors.selectRoutine"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        buildUrl("/collections/student_routines/records"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: studentId,
            routine_id: selectedRoutineId,
            status: "active",
            progress_current: 0,
            progress_total: 1,
            started_at: new Date().toISOString(),
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to assign routine");
      }

      setSelectedRoutineId("");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedRoutineId("");
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-lg border border-border bg-background-card p-8 shadow-md rounded-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {t("assignRoutineTitle")}
          </h2>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {routines.length === 0 ? (
            <div className="text-sm text-foreground-secondary">
              {t("noRoutinesAvailable")}
            </div>
          ) : (
            routines.map((routine) => (
              <label
                key={routine.id}
                className={`flex cursor-pointer items-center gap-3 border p-4 transition-colors duration-150 rounded-md ${
                  selectedRoutineId === routine.id
                    ? "border-accent bg-accent-light"
                    : "border-border hover:border-border-strong hover:bg-background-muted"
                }`}
              >
                <input
                  type="radio"
                  name="routine"
                  value={routine.id}
                  checked={selectedRoutineId === routine.id}
                  onChange={(e) => setSelectedRoutineId(e.target.value)}
                  className="h-4 w-4 accent-accent"
                />
                <div className="flex-1">
                  <div className="text-base font-medium text-foreground">
                    {routine.name}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.08em] text-foreground-muted">
                    {metaLine(routine)}
                  </div>
                </div>
              </label>
            ))
          )}

          {error && (
            <div className="text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-background-muted disabled:opacity-50 rounded-md"
          >
            {t("actions.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedRoutineId || isSubmitting || routines.length === 0}
            className="inline-flex h-10 items-center justify-center border border-accent bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {isSubmitting ? t("actions.assigning") : t("actions.assign")}
          </button>
        </div>
      </div>
    </div>
  );
}
