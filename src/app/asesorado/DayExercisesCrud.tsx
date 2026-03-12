"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/app/components/ToastProvider";
import { buildPocketBaseUrl } from "@/hooks/useRoutineProgress";

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
  allowDelete?: boolean;
};

function parseStepperValue(value: string, fallback: number) {
  const match = value.match(/\d+/);
  if (!match) return fallback;
  const parsed = Number(match[0]);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, parsed);
}

function sanitizeIntegerInput(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeIntegerString(value: string | number | undefined) {
  if (value === undefined || value === null) return "";
  const match = String(value).match(/\d+/);
  return match ? String(Number(match[0])) : "";
}

function formatLoggedCompletion(entry: DayExerciseEntry) {
  const setsValue = entry.loggedSets ?? null;
  const repsValue = entry.loggedReps ?? null;
  const weightValue = entry.loggedWeight ?? null;

  const setsReps =
    setsValue !== null && setsValue !== undefined && repsValue
      ? `${setsValue} x ${repsValue}`
      : null;

  const weight =
    weightValue !== null && weightValue !== undefined ? `${weightValue} kg` : null;

  if (setsReps && weight) return `${setsReps} · ${weight}`;
  if (setsReps) return setsReps;
  if (weight) return weight;
  return null;
}

export default function DayExercisesCrud({
  studentId,
  currentWeekKey,
  entries,
  allowDelete = true,
}: DayExercisesCrudProps) {
  const router = useRouter();
  const toast = useToast();

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"completed" | "skipped">("completed");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.routineExerciseId === selectedId) ?? null,
    [entries, selectedId],
  );
  const setsValue = normalizeIntegerString(sets);
  const repsValue = normalizeIntegerString(reps);
  const weightValue = String(weight ?? "").trim();
  const isCompletedWithMissingFields =
    status === "completed" && (!setsValue || !repsValue || !weightValue);
  const isCompletedWithInvalidWeight =
    status === "completed" &&
    (!weightValue || Number.isNaN(Number(weightValue)) || Number(weightValue) < 0);

  const openModal = (entry: DayExerciseEntry) => {
    setSelectedId(entry.routineExerciseId);
    setStatus(entry.status ?? "completed");
    setSets(normalizeIntegerString(entry.loggedSets ?? entry.sets));
    setReps(normalizeIntegerString(entry.loggedReps ?? entry.reps));
    setWeight(entry.loggedWeight != null ? String(entry.loggedWeight) : "");
  };

  const closeModal = () => {
    setSelectedId(null);
    setStatus("completed");
    setSets("");
    setReps("");
    setWeight("");
  };

  const saveEntry = async (entry: DayExerciseEntry, forceStatus?: "completed" | "skipped") => {
    const nextStatus = forceStatus ?? status;
    const localSetsValue = normalizeIntegerString(sets);
    const localRepsValue = normalizeIntegerString(reps);
    const localWeightValue = String(weight ?? "").trim();
    if (nextStatus === "completed") {
      if (!localSetsValue || !localRepsValue || !localWeightValue) {
        toast.error("Completa series, reps y peso para marcar como completado.");
        return;
      }
      const parsedWeight = Number(localWeightValue);
      if (Number.isNaN(parsedWeight) || parsedWeight < 0) {
        toast.error("Ingresa un peso válido.");
        return;
      }
    }

    const setsNum = localSetsValue ? Number(localSetsValue) : undefined;
    const weightNum = localWeightValue ? Number(localWeightValue) : undefined;

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
          completed_at: new Date().toISOString(),
          week_key: currentWeekKey,
          status: nextStatus,
          sets: setsNum,
          reps: localRepsValue || undefined,
          weight: weightNum,
        }),
      });

      if (!res.ok) throw new Error("save_failed");

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
            const containerStateClass =
              currentStatus === "completed"
                ? "border-l-4 border-l-accent bg-accent/5"
                : currentStatus === "skipped"
                  ? "border-l-4 border-l-warning bg-warning/10"
                  : "border-l-4 border-l-border bg-background-card";

            return (
              <div
                key={entry.routineExerciseId}
                className={`border border-border rounded-md p-3 transition-colors duration-150 ${containerStateClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{entry.exerciseName}</div>
                    <div className="mt-1 text-xs text-foreground-secondary uppercase tracking-[0.08em]">
                      {entry.muscleGroup ?? "-"}
                    </div>
                    <div className="mt-2 text-sm text-foreground-secondary">
                      {entry.sets ?? "-"} x {entry.reps ?? "-"}
                    </div>
                    {currentStatus === "completed" ? (
                      <div className="mt-1 text-xs font-medium text-accent">
                        {formatLoggedCompletion(entry) ?? "Completado sin detalle"}
                      </div>
                    ) : null}
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
                      setSets(normalizeIntegerString(entry.loggedSets ?? entry.sets));
                      setReps(normalizeIntegerString(entry.loggedReps ?? entry.reps));
                      setWeight(entry.loggedWeight != null ? String(entry.loggedWeight) : "");
                                        void saveEntry(entry, "skipped");
                    }}
                    disabled={isPending}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background-card px-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-background-muted disabled:opacity-60"
                  >
                    Omitir
                  </button>
                  {allowDelete && entry.completionId ? (
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
            className="w-full max-w-[430px] max-h-[92dvh] overflow-y-auto border border-border bg-background-card rounded-lg"
            style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
          >
            <div className="border-b border-border-subtle p-5">
              <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                Registro de ejercicio
              </div>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{selectedEntry.exerciseName}</h3>
            </div>

            <div className="flex flex-col gap-4 p-5">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Estado</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("completed")}
                    className={`h-10 w-full border text-sm font-medium rounded-md transition-colors duration-150 ${
                      status === "completed"
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background-card text-foreground hover:bg-background-muted"
                    }`}
                  >
                    Completado
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("skipped")}
                    className={`h-10 w-full border text-sm font-medium rounded-md transition-colors duration-150 ${
                      status === "skipped"
                        ? "border-foreground bg-foreground text-background-card"
                        : "border-border bg-background-card text-foreground hover:bg-background-muted"
                    }`}
                  >
                    Omitido
                  </button>
                </div>
              </label>


              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Series</span>
                <div className="grid grid-cols-[56px_minmax(0,1fr)_56px] items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSets(String(Math.max(0, parseStepperValue(sets, 0) - 1)))
                    }
                    className="inline-flex h-10 w-full items-center justify-center border border-border bg-background-card text-xl font-semibold text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                    aria-label="Decrease sets"
                  >
                    -
                  </button>
                  <input
                    value={sets}
                    onChange={(e) => setSets(sanitizeIntegerInput(e.target.value))}
                    inputMode="numeric"
                    className="h-10 flex-1 border border-border bg-background-card px-3 text-center text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                    placeholder="3"
                  />
                  <button
                    type="button"
                    onClick={() => setSets(String(parseStepperValue(sets, 0) + 1))}
                    className="inline-flex h-10 w-full items-center justify-center border border-border bg-background-card text-xl font-semibold text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                    aria-label="Increase sets"
                  >
                    +
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Reps</span>
                <div className="grid grid-cols-[56px_minmax(0,1fr)_56px] items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setReps(String(Math.max(0, parseStepperValue(reps, 0) - 1)))
                    }
                    className="inline-flex h-10 w-full items-center justify-center border border-border bg-background-card text-xl font-semibold text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                    aria-label="Decrease reps"
                  >
                    -
                  </button>
                  <input
                    value={reps}
                    onChange={(e) => setReps(sanitizeIntegerInput(e.target.value))}
                    inputMode="numeric"
                    className="h-10 flex-1 border border-border bg-background-card px-3 text-center text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                    placeholder="10"
                  />
                  <button
                    type="button"
                    onClick={() => setReps(String(parseStepperValue(reps, 0) + 1))}
                    className="inline-flex h-10 w-full items-center justify-center border border-border bg-background-card text-xl font-semibold text-foreground rounded-md transition-colors duration-150 hover:bg-background-muted"
                    aria-label="Increase reps"
                  >
                    +
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">Peso (kg)</span>
                <input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                  placeholder="40"
                />
              </label>

              {status === "completed" && (isCompletedWithMissingFields || isCompletedWithInvalidWeight) ? (
                <div className="rounded-md border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
                  {!setsValue || !repsValue || !weightValue
                    ? "Para completar el ejercicio debes completar series, reps y peso."
                    : "Ingresa un peso válido para completar el ejercicio."}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border-subtle p-5">
              {allowDelete && selectedEntry.completionId ? (
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
                disabled={
                  pendingId === selectedEntry.routineExerciseId ||
                  isCompletedWithMissingFields ||
                  isCompletedWithInvalidWeight
                }
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
