"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/app/components/ToastProvider";
import NumPad from "@/app/components/NumPad";
import { buildPocketBaseUrl } from "@/hooks/useRoutineProgress";

type ActiveField = "sets" | "reps" | "weight";

type OptimisticPatch = {
  status: "completed" | "skipped";
  loggedSets?: number;
  loggedReps?: string;
  loggedWeight?: number;
  completionId?: string;
};

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
  const [activeField, setActiveField] = useState<ActiveField>("sets");
  const [optimisticPatches, setOptimisticPatches] = useState<Record<string, OptimisticPatch>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());

  const viewEntries = useMemo(
    () =>
      entries.map((entry) => {
        if (deletedIds.has(entry.routineExerciseId)) {
          return { ...entry, status: undefined, completionId: undefined };
        }
        const patch = optimisticPatches[entry.routineExerciseId];
        return patch ? { ...entry, ...patch } : entry;
      }),
    [entries, optimisticPatches, deletedIds],
  );

  const entriesSignature = useMemo(
    () =>
      entries
        .map(
          (entry) =>
            `${entry.routineExerciseId}:${entry.status ?? "-"}:${entry.completionId ?? "-"}:${entry.loggedSets ?? "-"}:${entry.loggedReps ?? "-"}:${entry.loggedWeight ?? "-"}`,
        )
        .join("|"),
    [entries],
  );
  const lastSignatureRef = useRef(entriesSignature);

  useEffect(() => {
    if (lastSignatureRef.current === entriesSignature) return;
    lastSignatureRef.current = entriesSignature;
    setOptimisticPatches({});
    setDeletedIds(new Set());
  }, [entriesSignature]);

  const selectedEntry = useMemo(
    () => viewEntries.find((entry) => entry.routineExerciseId === selectedId) ?? null,
    [viewEntries, selectedId],
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
    setActiveField("sets");
  };

  const closeModal = () => {
    setSelectedId(null);
    setStatus("completed");
    setSets("");
    setReps("");
    setWeight("");
    setActiveField("sets");
  };

  const appendDigit = (digit: string) => {
    if (activeField === "sets") {
      setSets((prev) => (prev === "0" ? digit : (prev + digit).slice(0, 3)));
    } else if (activeField === "reps") {
      setReps((prev) => (prev === "0" ? digit : (prev + digit).slice(0, 3)));
    } else {
      setWeight((prev) => {
        const next = prev === "0" ? digit : prev + digit;
        return next.length > 6 ? prev : next;
      });
    }
  };

  const appendDot = () => {
    if (activeField !== "weight") return;
    setWeight((prev) => (prev.includes(".") ? prev : (prev || "0") + "."));
  };

  const backspace = () => {
    if (activeField === "sets") setSets((prev) => prev.slice(0, -1));
    else if (activeField === "reps") setReps((prev) => prev.slice(0, -1));
    else setWeight((prev) => prev.slice(0, -1));
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

    const patch: OptimisticPatch = {
      status: nextStatus,
      loggedSets: nextStatus === "completed" ? setsNum : undefined,
      loggedReps: nextStatus === "completed" ? localRepsValue || undefined : undefined,
      loggedWeight: nextStatus === "completed" ? weightNum : undefined,
      completionId: entry.completionId,
    };
    setOptimisticPatches((prev) => ({ ...prev, [entry.routineExerciseId]: patch }));
    setDeletedIds((prev) => {
      if (!prev.has(entry.routineExerciseId)) return prev;
      const next = new Set(prev);
      next.delete(entry.routineExerciseId);
      return next;
    });
    closeModal();
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
      router.refresh();
    } catch {
      setOptimisticPatches((prev) => {
        const next = { ...prev };
        delete next[entry.routineExerciseId];
        return next;
      });
      toast.error("No se pudo guardar el ejercicio.");
    } finally {
      setPendingId(null);
    }
  };

  const deleteEntry = async (entry: DayExerciseEntry) => {
    if (!entry.completionId) return;

    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.add(entry.routineExerciseId);
      return next;
    });
    setOptimisticPatches((prev) => {
      if (!prev[entry.routineExerciseId]) return prev;
      const next = { ...prev };
      delete next[entry.routineExerciseId];
      return next;
    });
    closeModal();
    setPendingId(entry.routineExerciseId);

    try {
      const res = await fetch(
        buildPocketBaseUrl(`/collections/exercise_completions/records/${entry.completionId}`),
        { method: "DELETE" },
      );
      if (!res.ok && res.status !== 404) throw new Error("delete_failed");

      toast.success("Registro eliminado.");
      router.refresh();
    } catch {
      setDeletedIds((prev) => {
        if (!prev.has(entry.routineExerciseId)) return prev;
        const next = new Set(prev);
        next.delete(entry.routineExerciseId);
        return next;
      });
      toast.error("No se pudo eliminar el registro.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <div className="mt-4 flex flex-col gap-2">
        {viewEntries.length === 0 ? (
          <div className="border border-border rounded-md p-3 text-sm text-foreground-secondary">
            No hay ejercicios cargados para este día.
          </div>
        ) : (
          viewEntries.map((entry) => {
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
                aria-busy={isPending || undefined}
                className={`border border-border rounded-md p-3 transition-all duration-200 ease-out ${containerStateClass} ${isPending ? "opacity-80" : ""}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4" role="dialog" aria-modal="true">
          <div
            className="modal-enter w-full max-w-[430px] max-h-[92dvh] overflow-y-auto border border-border bg-background-card rounded-lg"
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


              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: "sets", label: "Series", value: sets || "—" },
                  { key: "reps", label: "Reps", value: reps || "—" },
                  { key: "weight", label: "Peso (kg)", value: weight || "—" },
                ] as const).map((field) => {
                  const isActive = activeField === field.key;
                  return (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => setActiveField(field.key)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-md border px-2 py-3 transition-colors duration-150 ${
                        isActive
                          ? "border-accent bg-accent/10"
                          : "border-border bg-background-card hover:bg-background-muted"
                      }`}
                    >
                      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-foreground-muted">
                        {field.label}
                      </span>
                      <span
                        className={`text-xl font-semibold tabular-nums ${
                          isActive ? "text-accent" : "text-foreground"
                        }`}
                      >
                        {field.value}
                      </span>
                    </button>
                  );
                })}
              </div>

              <NumPad
                onDigit={appendDigit}
                onDot={appendDot}
                onBackspace={backspace}
                allowDecimal={activeField === "weight"}
              />

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
