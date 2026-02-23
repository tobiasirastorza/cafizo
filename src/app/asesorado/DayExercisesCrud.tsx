"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/app/components/ToastProvider";
import { buildPocketBaseUrl, recalculateRoutineProgress } from "@/hooks/useRoutineProgress";

type DayExerciseEntry = {
  routineExerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
  sets?: number | string;
  reps?: string;
  completionId?: string;
  status?: "completed" | "skipped";
  loggedSets?: number;
  loggedReps?: string;
  loggedWeight?: number;
};

type DayExercisesCrudProps = {
  studentId: string;
  currentWeekKey: string;
  entries: DayExerciseEntry[];
};

function toLocalDatetimeInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function DayExercisesCrud({
  studentId,
  currentWeekKey,
  entries,
}: DayExercisesCrudProps) {
  const router = useRouter();
  const toast = useToast();

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"completed" | "skipped">("completed");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [completedAt, setCompletedAt] = useState(toLocalDatetimeInputValue(new Date()));

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.routineExerciseId === selectedId) ?? null,
    [entries, selectedId],
  );

  const openModal = (entry: DayExerciseEntry) => {
    setSelectedId(entry.routineExerciseId);
    setStatus(entry.status ?? "completed");
    setSets(String(entry.loggedSets ?? entry.sets ?? ""));
    setReps(entry.loggedReps ?? entry.reps ?? "");
    setWeight(entry.loggedWeight != null ? String(entry.loggedWeight) : "");
    setCompletedAt(toLocalDatetimeInputValue(new Date()));
  };

  const closeModal = () => {
    setSelectedId(null);
    setStatus("completed");
    setSets("");
    setReps("");
    setWeight("");
    setCompletedAt(toLocalDatetimeInputValue(new Date()));
  };

  const saveEntry = async (entry: DayExerciseEntry, forceStatus?: "completed" | "skipped") => {
    const nextStatus = forceStatus ?? status;
    const completedDate = new Date(completedAt);
    if (Number.isNaN(completedDate.getTime())) {
      toast.error("Fecha inválida.");
      return;
    }

    const setsNum = sets.trim() ? Number(sets) : undefined;
    const weightNum = weight.trim() ? Number(weight) : undefined;

    setPendingId(entry.routineExerciseId);
    try {
      const endpoint = entry.completionId
        ? `/collections/exercise_completions/records/${entry.completionId}`
        : "/collections/exercise_completions/records";

      const res = await fetch(buildPocketBaseUrl(endpoint), {
        method: entry.completionId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          routine_exercise_id: entry.routineExerciseId,
          completed_at: completedDate.toISOString(),
          week_key: currentWeekKey,
          status: nextStatus,
          sets: setsNum,
          reps: reps.trim() || undefined,
          weight: weightNum,
        }),
      });

      if (!res.ok) throw new Error("save_failed");

      await recalculateRoutineProgress(studentId, currentWeekKey);
      toast.success(nextStatus === "completed" ? "Ejercicio registrado." : "Ejercicio omitido.");
      closeModal();
      router.refresh();
    } catch {
      toast.error("No se pudo guardar el ejercicio.");
    } finally {
      setPendingId(null);
    }
  };

  const deleteEntry = async (entry: DayExerciseEntry) => {
    if (!entry.completionId) return;

    setPendingId(entry.routineExerciseId);
    try {
      const res = await fetch(
        buildPocketBaseUrl(`/collections/exercise_completions/records/${entry.completionId}`),
        { method: "DELETE" },
      );
      if (!res.ok && res.status !== 404) throw new Error("delete_failed");

      await recalculateRoutineProgress(studentId, currentWeekKey);
      toast.success("Registro eliminado.");
      closeModal();
      router.refresh();
    } catch {
      toast.error("No se pudo eliminar el registro.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <div className="mt-4 flex flex-col gap-2">
        {entries.length === 0 ? (
          <div className="border border-border rounded-md p-3 text-sm text-foreground-secondary">
            No hay ejercicios cargados para este día.
          </div>
        ) : (
          entries.map((entry) => {
            const isPending = pendingId === entry.routineExerciseId;
            const currentStatus = entry.status ?? "pending";

            return (
              <div key={entry.routineExerciseId} className="border border-border rounded-md p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{entry.exerciseName}</div>
                    <div className="mt-1 text-xs text-foreground-secondary uppercase tracking-[0.08em]">
                      {entry.muscleGroup ?? "-"}
                    </div>
                    <div className="mt-2 text-sm text-foreground-secondary">
                      {entry.sets ?? "-"} x {entry.reps ?? "-"}
                    </div>
                  </div>
                  <span
                    className={`rounded-[4px] px-2 py-1 text-xs font-medium ${
                      currentStatus === "completed"
                        ? "bg-accent/10 text-accent"
                        : currentStatus === "skipped"
                          ? "bg-warning/10 text-warning"
                          : "bg-background-muted text-foreground-secondary"
                    }`}
                  >
                    {currentStatus === "completed"
                      ? "Completado"
                      : currentStatus === "skipped"
                        ? "Omitido"
                        : "Sin registro"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openModal(entry)}
                    disabled={isPending}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-3 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90 disabled:opacity-60"
                  >
                    {entry.completionId ? "Editar" : "Completar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(entry.routineExerciseId);
                      setStatus("skipped");
                      setSets(String(entry.loggedSets ?? entry.sets ?? ""));
                      setReps(entry.loggedReps ?? entry.reps ?? "");
                      setWeight(entry.loggedWeight != null ? String(entry.loggedWeight) : "");
                      setCompletedAt(toLocalDatetimeInputValue(new Date()));
                      void saveEntry(entry, "skipped");
                    }}
                    disabled={isPending}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background-card px-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-background-muted disabled:opacity-60"
                  >
                    Omitir
                  </button>
                  {entry.completionId ? (
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry)}
                      disabled={isPending}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-error bg-background-card px-3 text-sm font-medium text-error transition-colors duration-150 hover:bg-error/10 disabled:opacity-60"
                    >
                      Eliminar
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
          <div
            className="w-full max-w-lg border border-border bg-background-card rounded-lg"
            style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
          >
            <div className="border-b border-border-subtle p-5">
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                Registro de ejercicio
              </div>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{selectedEntry.exerciseName}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Estado</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "completed" | "skipped")}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                >
                  <option value="completed">Completado</option>
                  <option value="skipped">Omitido</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Fecha</span>
                <input
                  type="datetime-local"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Series</span>
                <input
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                  placeholder="3"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Reps</span>
                <input
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                  placeholder="8-10"
                />
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Peso (kg)</span>
                <input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                  placeholder="40"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border-subtle p-5">
              {selectedEntry.completionId ? (
                <button
                  type="button"
                  onClick={() => deleteEntry(selectedEntry)}
                  disabled={pendingId === selectedEntry.routineExerciseId}
                  className="inline-flex h-10 items-center justify-center border border-error bg-error px-4 text-sm font-medium text-white rounded-md transition-colors duration-150 hover:bg-error/90 disabled:opacity-60"
                >
                  Eliminar
                </button>
              ) : null}
              <button
                type="button"
                onClick={closeModal}
                disabled={pendingId === selectedEntry.routineExerciseId}
                className="inline-flex h-10 items-center justify-center border border-border bg-background-card px-4 text-sm font-medium text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => saveEntry(selectedEntry)}
                disabled={pendingId === selectedEntry.routineExerciseId}
                className="inline-flex h-10 items-center justify-center border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90 disabled:opacity-60"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
