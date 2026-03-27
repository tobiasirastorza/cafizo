"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { buildPocketBaseUrl } from "@/hooks/useRoutineProgress";

type ClassSchedule = {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  is_active?: boolean;
};

type ClassBooking = {
  id: string;
  student_id: string;
  schedule_id: string;
  class_date: string;
  status: "reserved" | "attended" | "cancelled" | "no_show";
};

type ClassSchedulesPanelProps = {
  studentId: string;
  schedules: ClassSchedule[];
  bookings: ClassBooking[];
  locale: string;
};

const ACTIVE_BOOKING_STATUSES = new Set(["reserved", "attended"]);
const DAY_NAMES_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const DAY_NAMES_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getBookingDateKey(classDate: string) {
  return classDate.slice(0, 10);
}

function getNextOccurrence(dayOfWeek: number, startTime: string) {
  const now = new Date();
  const [hours, minutes] = startTime.split(":").map((value) => Number(value));
  const candidate = new Date(now);
  const daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
  candidate.setDate(now.getDate() + daysUntil);
  candidate.setHours(hours || 0, minutes || 0, 0, 0);

  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return candidate;
}

export default function ClassSchedulesPanel({
  studentId,
  schedules,
  bookings,
  locale,
}: ClassSchedulesPanelProps) {
  const router = useRouter();
  const [isSubmittingKey, setIsSubmittingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    return schedules
      .filter((schedule) => schedule.is_active ?? true)
      .map((schedule) => {
        const nextDate = getNextOccurrence(schedule.day_of_week, schedule.start_time);
        const dateKey = formatDateKey(nextDate);
        const dayName =
          locale === "es"
            ? DAY_NAMES_ES[schedule.day_of_week] ?? "-"
            : DAY_NAMES_EN[schedule.day_of_week] ?? "-";
        const activeBookings = bookings.filter(
          (booking) =>
            booking.schedule_id === schedule.id &&
            getBookingDateKey(booking.class_date) === dateKey &&
            ACTIVE_BOOKING_STATUSES.has(booking.status),
        );
        const occupied = activeBookings.length;
        const myBooking =
          activeBookings.find((booking) => booking.student_id === studentId) ?? null;

        return {
          schedule,
          nextDate,
          dateKey,
          dayName,
          occupied,
          myBooking,
        };
      })
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  }, [bookings, locale, schedules, studentId]);

  const reserveClass = async (scheduleId: string, classDateIso: string, actionKey: string) => {
    setIsSubmittingKey(actionKey);
    setError(null);
    try {
      const response = await fetch(buildPocketBaseUrl("/collections/class_bookings/records"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          schedule_id: scheduleId,
          class_date: classDateIso,
          status: "reserved",
        }),
      });

      if (!response.ok) {
        throw new Error(locale === "es" ? "No se pudo reservar." : "Could not reserve.");
      }

      router.refresh();
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : locale === "es"
            ? "No se pudo reservar."
            : "Could not reserve.",
      );
    } finally {
      setIsSubmittingKey(null);
    }
  };

  const cancelBooking = async (bookingId: string, actionKey: string) => {
    const confirmed = window.confirm(
      locale === "es"
        ? "¿Seguro que querés cancelar esta reserva?"
        : "Are you sure you want to cancel this reservation?",
    );
    if (!confirmed) return;

    setIsSubmittingKey(actionKey);
    setError(null);
    try {
      const response = await fetch(
        buildPocketBaseUrl(`/collections/class_bookings/records/${bookingId}`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        },
      );

      if (!response.ok) {
        throw new Error(locale === "es" ? "No se pudo cancelar." : "Could not cancel.");
      }

      router.refresh();
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : locale === "es"
            ? "No se pudo cancelar."
            : "Could not cancel.",
      );
    } finally {
      setIsSubmittingKey(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="border border-border rounded-md p-3 text-sm text-foreground-secondary">
        {locale === "es"
          ? "Todavía no hay horarios de clases activos."
          : "There are no active class schedules yet."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map(({ schedule, nextDate, dayName, occupied, myBooking, dateKey }) => {
        const isFull = occupied >= schedule.capacity;
        const actionKey = `${schedule.id}-${dateKey}`;
        const isPending = isSubmittingKey === actionKey;

        return (
          <div key={actionKey} className="border border-border rounded-md p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">{schedule.name}</div>
                <div className="mt-1 text-xs text-foreground-secondary">
                  {dayName} · {schedule.start_time} - {schedule.end_time}
                </div>
                <div className="mt-1 text-xs text-foreground-secondary">
                  {nextDate.toLocaleDateString(locale)}
                </div>
              </div>
              <span
                className={`rounded-[4px] px-2 py-1 text-xs font-medium ${
                  isFull
                    ? "bg-error/10 text-error"
                    : "bg-accent/10 text-accent"
                }`}
              >
                {occupied}/{schedule.capacity}
              </span>
            </div>
            <div className="mt-3">
              {myBooking ? (
                <button
                  type="button"
                  onClick={() => cancelBooking(myBooking.id, actionKey)}
                  disabled={isPending}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm text-foreground hover:bg-background-muted disabled:opacity-60"
                >
                  {isPending
                    ? locale === "es"
                      ? "Cancelando..."
                      : "Cancelling..."
                    : locale === "es"
                      ? "Cancelar reserva"
                      : "Cancel reservation"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    reserveClass(schedule.id, nextDate.toISOString(), actionKey)
                  }
                  disabled={isPending || isFull}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-accent/20 bg-accent/10 px-3 text-sm text-accent hover:bg-accent/20 disabled:opacity-60"
                >
                  {isPending
                    ? locale === "es"
                      ? "Reservando..."
                      : "Reserving..."
                    : locale === "es"
                      ? "Reservar"
                      : "Reserve"}
                </button>
              )}
            </div>
          </div>
        );
      })}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
