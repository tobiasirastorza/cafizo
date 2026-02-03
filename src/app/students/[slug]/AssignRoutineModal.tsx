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

const PB_BASE = "http://127.0.0.1:8090/api";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg border-2 border-border bg-background p-8 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
            {t("assignRoutineTitle")}
          </h2>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {routines.length === 0 ? (
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {t("noRoutinesAvailable")}
            </div>
          ) : (
            routines.map((routine) => (
              <label
                key={routine.id}
                className={`flex cursor-pointer items-center gap-4 border-2 p-4 transition-colors ${
                  selectedRoutineId === routine.id
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/50"
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
                  <div className="text-lg font-bold uppercase tracking-tight text-foreground">
                    {routine.name}
                  </div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {routine.level?.toUpperCase()} • {routine.split?.toUpperCase()} •{" "}
                    {routine.days_per_week} days/week
                  </div>
                </div>
              </label>
            ))
          )}

          {error && (
            <div className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center border-2 border-border px-6 text-sm font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
          >
            {t("actions.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedRoutineId || isSubmitting || routines.length === 0}
            className="inline-flex h-12 items-center justify-center border-2 border-accent bg-accent px-8 text-sm font-black uppercase tracking-[0.2em] text-accent-foreground transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("actions.assigning") : t("actions.assign")}
          </button>
        </div>
      </div>
    </div>
  );
}
