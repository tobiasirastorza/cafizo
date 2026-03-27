"use client";

import {
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiSaveLine,
  RiUserAddLine,
} from "@remixicon/react";

import { useToast } from "@/app/components/ToastProvider";
import PageHeader from "@/app/components/PageHeader";
import { buildPocketBaseUrl } from "@/hooks/useRoutineProgress";

type Student = {
  id: string;
  name: string;
};

type Booking = {
  id: string;
  student_id?: string;
  schedule_id: string;
  class_date: string;
  status: "reserved" | "attended" | "cancelled" | "no_show";
  expand?: {
    student_id?: {
      id: string;
      name: string;
    };
  };
};

type Schedule = {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
};

type ClassesPageClientProps = {
  schedules: Schedule[];
  bookings: Booking[];
  students: Student[];
};

type ScheduleDraft = {
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: string;
};

const DAY_OPTIONS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const EMPTY_DRAFT: ScheduleDraft = {
  name: "",
  day_of_week: 1,
  start_time: "18:00",
  end_time: "19:00",
  capacity: "10",
};

const ACTIVE_STATUSES = new Set(["reserved", "attended"]);
const INPUT_BASE =
  "block h-11 w-full rounded-md border border-border bg-background-card px-3 text-sm text-foreground transition-colors duration-150 focus:border-accent focus:outline-none";

function IconActionButton({
  label,
  onClick,
  icon,
  disabled = false,
  tone = "neutral",
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  disabled?: boolean;
  tone?: "neutral" | "accent" | "danger";
}) {
  const toneClass =
    tone === "accent"
      ? "border-accent bg-accent text-accent-foreground hover:bg-accent/90"
      : tone === "danger"
        ? "border-border bg-background-card text-foreground hover:text-error"
        : "border-border bg-background-card text-foreground hover:bg-background-muted";

  return (
    <div className="group relative">
      <span className="pointer-events-none absolute -top-11 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background shadow-sm group-hover:block group-focus-within:block">
        {label}
        <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-foreground" />
      </span>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors duration-150 disabled:opacity-60 ${toneClass}`}
      >
        {icon}
      </button>
    </div>
  );
}

function getNextOccurrence(dayOfWeek: number, startTime: string) {
  const now = new Date();
  const [hours, minutes] = startTime.split(":").map((value) => Number(value));
  const candidate = new Date(now);
  const daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
  candidate.setDate(now.getDate() + daysUntil);
  candidate.setHours(hours || 0, minutes || 0, 0, 0);
  if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 7);
  return candidate;
}

function NewClassModal({
  draft,
  setDraft,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  draft: ScheduleDraft;
  setDraft: Dispatch<SetStateAction<ScheduleDraft>>;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
      <div className="modal-enter w-full max-w-2xl rounded-lg border border-border bg-background-card p-6 shadow-md">
        <h2 className="text-3xl font-semibold leading-tight text-foreground">Nueva clase</h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Completá el horario. Todos los campos son obligatorios.
        </p>

        <div className="mt-5 rounded-lg border border-border-subtle bg-background-muted/40 p-4 md:p-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-class-name"
                className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-label"
              >
                Nombre de la clase *
              </label>
              <input
                id="new-class-name"
                value={draft.name}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Funcional, GAP, Stretching..."
                className={INPUT_BASE}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="new-class-day"
                  className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-label"
                >
                  Día *
                </label>
                <select
                  id="new-class-day"
                  value={draft.day_of_week}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, day_of_week: Number(event.target.value) }))
                  }
                  className={INPUT_BASE}
                >
                  {DAY_OPTIONS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="new-class-capacity"
                  className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-label"
                >
                  Cupo máximo *
                </label>
                <input
                  id="new-class-capacity"
                  type="number"
                  min={1}
                  value={draft.capacity}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, capacity: event.target.value }))
                  }
                  placeholder="10"
                  className={INPUT_BASE}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="new-class-start"
                  className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-label"
                >
                  Hora de inicio *
                </label>
                <input
                  id="new-class-start"
                  type="time"
                  value={draft.start_time}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, start_time: event.target.value }))
                  }
                  className={INPUT_BASE}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="new-class-end"
                  className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-label"
                >
                  Hora de fin *
                </label>
                <input
                  id="new-class-end"
                  type="time"
                  value={draft.end_time}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, end_time: event.target.value }))
                  }
                  className={INPUT_BASE}
                />
              </div>
            </div>

            <p className="text-xs text-foreground-muted">
              El cupo controla la cantidad de reservas por horario.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-md border border-border bg-background-card px-4 text-sm font-medium text-foreground transition-all duration-150 hover:-translate-y-0.5 hover:bg-background-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground transition-all duration-150 hover:-translate-y-0.5 hover:bg-accent/90 disabled:opacity-60"
          >
            {isSubmitting ? "Creando..." : "Crear clase"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignStudentsModal({
  scheduleName,
  students,
  selectedStudentIds,
  onToggle,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  scheduleName: string;
  students: Student[];
  selectedStudentIds: Set<string>;
  onToggle: (studentId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return students;
    return students.filter((student) => student.name.toLowerCase().includes(normalized));
  }, [query, students]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
      <div className="modal-enter w-full max-w-xl rounded-lg border border-border bg-background-card p-6 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold text-foreground">Asignar alumnos</h2>
          <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            {selectedStudentIds.size} seleccionados
          </span>
        </div>
        <p className="mt-1 text-sm text-foreground-secondary">{scheduleName}</p>

        <div className="mt-4 space-y-1.5">
          <label
            htmlFor="assign-students-search"
            className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-label"
          >
            Buscar alumno
          </label>
          <input
            id="assign-students-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre del alumno"
            className={INPUT_BASE}
          />
        </div>

        <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto rounded-md border border-border p-2">
          {filtered.map((student) => (
            <label
              key={student.id}
              className="flex items-center justify-between rounded-md border border-border bg-background-card px-3 py-2"
            >
              <span className="text-sm text-foreground">{student.name}</span>
              <input
                type="checkbox"
                checked={selectedStudentIds.has(student.id)}
                onChange={() => onToggle(student.id)}
                className="h-4 w-4 accent-accent"
              />
            </label>
          ))}
          {filtered.length === 0 ? (
            <p className="p-2 text-sm text-foreground-secondary">No hay alumnos.</p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-md border border-border bg-background-card px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-background-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center rounded-md border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground transition-all duration-150 hover:-translate-y-0.5 hover:bg-accent/90 disabled:opacity-60"
          >
            {isSubmitting ? "Guardando..." : "Guardar asignación"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClassesPageClient({
  schedules,
  bookings,
  students,
}: ClassesPageClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [createDraft, setCreateDraft] = useState<ScheduleDraft>(EMPTY_DRAFT);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ScheduleDraft>(EMPTY_DRAFT);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [assignScheduleId, setAssignScheduleId] = useState<string | null>(null);
  const [assignSelectedStudents, setAssignSelectedStudents] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    return schedules.map((schedule) => {
      const nextDate = getNextOccurrence(schedule.day_of_week, schedule.start_time);
      const dateKey = nextDate.toISOString().slice(0, 10);
      const activeBookings = bookings.filter(
        (booking) =>
          booking.schedule_id === schedule.id &&
          booking.class_date.slice(0, 10) === dateKey &&
          ACTIVE_STATUSES.has(booking.status),
      );

      return {
        ...schedule,
        nextDate,
        activeBookings,
        occupied: activeBookings.length,
      };
    });
  }, [bookings, schedules]);

  const assignRow = assignScheduleId
    ? rows.find((row) => row.id === assignScheduleId) ?? null
    : null;

  const runRequest = async (key: string, fn: () => Promise<void>) => {
    setPendingKey(key);
    try {
      await fn();
      router.refresh();
    } finally {
      setPendingKey(null);
    }
  };

  const createSchedule = async () => {
    if (!createDraft.name.trim()) {
      toast.error("Ingresá nombre de clase.");
      return;
    }

    const capacity = Number(createDraft.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) {
      toast.error("Capacidad inválida.");
      return;
    }

    await runRequest("create-schedule", async () => {
      const res = await fetch(buildPocketBaseUrl("/collections/class_schedules/records"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createDraft.name.trim(),
          day_of_week: createDraft.day_of_week,
          start_time: createDraft.start_time,
          end_time: createDraft.end_time,
          capacity,
          is_active: true,
        }),
      });

      if (!res.ok) throw new Error("No se pudo crear la clase.");
      toast.success("Clase creada.");
      setCreateDraft(EMPTY_DRAFT);
      setShowCreateModal(false);
    }).catch((error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la clase.");
    });
  };

  const startEdit = (schedule: Schedule) => {
    setEditId(schedule.id);
    setEditDraft({
      name: schedule.name,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      capacity: String(schedule.capacity),
    });
  };

  const saveEdit = async (scheduleId: string) => {
    const capacity = Number(editDraft.capacity);
    if (!editDraft.name.trim()) {
      toast.error("Ingresá nombre de clase.");
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      toast.error("Capacidad inválida.");
      return;
    }

    await runRequest(`save-${scheduleId}`, async () => {
      const res = await fetch(
        buildPocketBaseUrl(`/collections/class_schedules/records/${scheduleId}`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editDraft.name.trim(),
            day_of_week: editDraft.day_of_week,
            start_time: editDraft.start_time,
            end_time: editDraft.end_time,
            capacity,
          }),
        },
      );

      if (!res.ok) throw new Error("No se pudo actualizar la clase.");
      toast.success("Clase actualizada.");
      setEditId(null);
    }).catch((error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la clase.");
    });
  };

  const removeSchedule = async (scheduleId: string) => {
    if (!window.confirm("¿Eliminar esta clase?")) return;

    await runRequest(`delete-${scheduleId}`, async () => {
      const res = await fetch(
        buildPocketBaseUrl(`/collections/class_schedules/records/${scheduleId}`),
        { method: "DELETE" },
      );
      if (!res.ok && res.status !== 404) throw new Error("No se pudo eliminar la clase.");
      toast.success("Clase eliminada.");
    }).catch((error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la clase.");
    });
  };

  const openAssignModal = (rowId: string) => {
    const row = rows.find((entry) => entry.id === rowId);
    if (!row) return;
    setAssignScheduleId(rowId);
    setAssignSelectedStudents(
      new Set(
        row.activeBookings
          .map((booking) => booking.expand?.student_id?.id ?? booking.student_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
  };

  const saveAssignments = async () => {
    if (!assignRow) return;

    const currentByStudent = new Map<string, Booking>();
    assignRow.activeBookings.forEach((booking) => {
      const studentId = booking.expand?.student_id?.id ?? booking.student_id;
      if (studentId) currentByStudent.set(studentId, booking);
    });

    const toCreate = [...assignSelectedStudents].filter(
      (studentId) => !currentByStudent.has(studentId),
    );
    const toCancel = [...currentByStudent.entries()]
      .filter(([studentId]) => !assignSelectedStudents.has(studentId))
      .map(([, booking]) => booking);

    await runRequest(`assign-${assignRow.id}`, async () => {
      const targetDateKey = assignRow.nextDate.toISOString().slice(0, 10);
      const reusableByStudent = new Map<string, Booking>();
      bookings
        .filter(
          (booking) =>
            booking.schedule_id === assignRow.id &&
            booking.class_date.slice(0, 10) === targetDateKey &&
            !ACTIVE_STATUSES.has(booking.status),
        )
        .forEach((booking) => {
          const studentId = booking.expand?.student_id?.id ?? booking.student_id;
          if (studentId) reusableByStudent.set(studentId, booking);
        });

      const toRevive = toCreate
        .map((studentId) => ({
          studentId,
          booking: reusableByStudent.get(studentId),
        }))
        .filter(
          (entry): entry is { studentId: string; booking: Booking } =>
            Boolean(entry.booking),
        );

      const toInsert = toCreate.filter((studentId) => !reusableByStudent.has(studentId));

      const reviveResponses = await Promise.all(
        toRevive.map((entry) =>
          fetch(
            buildPocketBaseUrl(`/collections/class_bookings/records/${entry.booking.id}`),
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "reserved",
                class_date: assignRow.nextDate.toISOString(),
              }),
            },
          ),
        ),
      );

      const createResponses = await Promise.all(
        toInsert.map((studentId) =>
          fetch(buildPocketBaseUrl("/collections/class_bookings/records"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id: studentId,
              schedule_id: assignRow.id,
              class_date: assignRow.nextDate.toISOString(),
              status: "reserved",
            }),
          }),
        ),
      );

      const cancelResponses = await Promise.all(
        toCancel.map((booking) =>
          fetch(buildPocketBaseUrl(`/collections/class_bookings/records/${booking.id}`), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "cancelled" }),
          }),
        ),
      );

      const failed = [...reviveResponses, ...createResponses, ...cancelResponses].filter(
        (response) => !response.ok,
      );

      if (failed.length > 0) {
        const details = await Promise.all(
          failed.map((response) => response.text().catch(() => "")),
        );
        throw new Error(
          details.find((detail) => detail.trim().length > 0) ??
            "No se pudo guardar asignación.",
        );
      }

      const createdCount = toInsert.length;
      const revivedCount = toRevive.length;
      const cancelledCount = toCancel.length;
      toast.success(
        `Asignación guardada. +${createdCount} nuevos, ${revivedCount} reactivados, ${cancelledCount} removidos.`,
      );
      setAssignScheduleId(null);
    }).catch((error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar asignación.");
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clases"
        subtitle="Gestioná horarios, cupos y asignaciones por alumno."
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground transition-all duration-150 hover:-translate-y-0.5 hover:bg-accent/90"
          >
            <RiAddLine size={18} />
            Nueva clase
          </button>
        }
      />

      <section className="rounded-lg border border-border bg-background-card p-4 md:p-5">
        <h2 className="text-lg font-semibold text-foreground">Horarios</h2>
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-foreground-secondary">No hay clases creadas.</p>
          ) : (
            rows.map((row) => {
              const isEditing = editId === row.id;
              return (
                <div
                  key={row.id}
                  className="rounded-md border border-border bg-background-card p-3 transition-colors duration-150 hover:bg-background-muted/40"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="grid gap-2 md:grid-cols-6">
                          <input
                            value={editDraft.name}
                            onChange={(event) =>
                              setEditDraft((prev) => ({ ...prev, name: event.target.value }))
                            }
                            className={`${INPUT_BASE} h-10 md:col-span-2`}
                          />
                          <select
                            value={editDraft.day_of_week}
                            onChange={(event) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                day_of_week: Number(event.target.value),
                              }))
                            }
                            className={`${INPUT_BASE} h-10`}
                          >
                            {DAY_OPTIONS.map((day) => (
                              <option key={day.value} value={day.value}>
                                {day.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="time"
                            value={editDraft.start_time}
                            onChange={(event) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                start_time: event.target.value,
                              }))
                            }
                            className={`${INPUT_BASE} h-10`}
                          />
                          <input
                            type="time"
                            value={editDraft.end_time}
                            onChange={(event) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                end_time: event.target.value,
                              }))
                            }
                            className={`${INPUT_BASE} h-10`}
                          />
                          <input
                            type="number"
                            min={1}
                            value={editDraft.capacity}
                            onChange={(event) =>
                              setEditDraft((prev) => ({ ...prev, capacity: event.target.value }))
                            }
                            className={`${INPUT_BASE} h-10`}
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-base font-semibold text-foreground">{row.name}</h3>
                          <p className="mt-1 text-sm text-foreground-secondary">
                            {DAY_OPTIONS.find((item) => item.value === row.day_of_week)?.label ??
                              "-"}{" "}
                            · {row.start_time} - {row.end_time}
                          </p>
                          <p className="mt-1 text-xs text-foreground-muted">
                            Próxima fecha: {row.nextDate.toLocaleDateString("es-AR")}
                          </p>
                          <div className="mt-2">
                            <span
                              className={`inline-flex rounded-[4px] px-2 py-1 text-xs font-medium ${
                                row.occupied >= row.capacity
                                  ? "bg-error/10 text-error"
                                  : "bg-accent/10 text-accent"
                              }`}
                            >
                              {row.occupied}/{row.capacity}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <IconActionButton
                        label="Asignar alumnos"
                        onClick={() => openAssignModal(row.id)}
                        icon={<RiUserAddLine size={18} />}
                      />

                      {isEditing ? (
                        <>
                          <IconActionButton
                            label="Guardar cambios"
                            onClick={() => void saveEdit(row.id)}
                            disabled={pendingKey === `save-${row.id}`}
                            tone="accent"
                            icon={<RiSaveLine size={18} />}
                          />
                          <button
                            type="button"
                            onClick={() => setEditId(null)}
                            className="inline-flex h-10 items-center rounded-md border border-border bg-background-card px-3 text-sm text-foreground transition-colors duration-150 hover:bg-background-muted"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <IconActionButton
                            label="Editar clase"
                            onClick={() => startEdit(row)}
                            icon={<RiEditLine size={18} />}
                          />
                          <IconActionButton
                            label="Eliminar clase"
                            onClick={() => void removeSchedule(row.id)}
                            disabled={pendingKey === `delete-${row.id}`}
                            tone="danger"
                            icon={<RiDeleteBinLine size={18} />}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing && row.activeBookings.length > 0 ? (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                        Alumnos asignados
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {row.activeBookings.map((booking) => (
                          <span
                            key={booking.id}
                            className="inline-flex rounded-[4px] border border-border bg-background-card px-2 py-1 text-xs text-foreground-secondary"
                          >
                            {booking.expand?.student_id?.name ?? "Alumno"}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>

      {showCreateModal ? (
        <NewClassModal
          draft={createDraft}
          setDraft={setCreateDraft}
          onClose={() => setShowCreateModal(false)}
          onSubmit={() => void createSchedule()}
          isSubmitting={pendingKey === "create-schedule"}
        />
      ) : null}

      {assignRow ? (
        <AssignStudentsModal
          scheduleName={assignRow.name}
          students={students}
          selectedStudentIds={assignSelectedStudents}
          onToggle={(studentId) =>
            setAssignSelectedStudents((prev) => {
              const next = new Set(prev);
              if (next.has(studentId)) next.delete(studentId);
              else next.add(studentId);
              return next;
            })
          }
          onClose={() => setAssignScheduleId(null)}
          onSubmit={() => void saveAssignments()}
          isSubmitting={pendingKey === `assign-${assignRow.id}`}
        />
      ) : null}
    </div>
  );
}
