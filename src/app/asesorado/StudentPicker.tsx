"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type StudentItem = {
  id: string;
  name: string;
  phone?: string;
};

type StudentPickerProps = {
  students: StudentItem[];
};

export default function StudentPicker({ students }: StudentPickerProps) {
  const toast = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleCopy = async (studentId: string) => {
    setPendingId(studentId);
    try {
      const url = `${window.location.origin}/pwa?student=${studentId}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado.");
    } catch {
      toast.error("No se pudo copiar el link.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="mt-6 flex flex-col gap-2" aria-busy={pendingId !== null}>
      {students.map((student) => {
        const isPending = pendingId === student.id;
        return (
          <button
            key={student.id}
            type="button"
            onClick={() => void handleCopy(student.id)}
            disabled={pendingId !== null}
            className="w-full border border-border bg-background-card rounded-md p-3 text-left transition-colors duration-150 hover:bg-background-muted disabled:opacity-80"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">{student.name}</div>
                <div className="mt-1 text-xs text-foreground-secondary">{student.phone ?? "-"}</div>
              </div>
              {isPending ? (
                <div className="h-5 w-5 rounded-full border-2 border-border border-t-accent animate-spin" />
              ) : (
                <span className="text-xs font-medium text-foreground-secondary">Copiar link</span>
              )}
            </div>
          </button>
        );
      })}
    </section>
  );
}
