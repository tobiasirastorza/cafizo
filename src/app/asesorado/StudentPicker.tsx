"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StudentItem = {
  id: string;
  name: string;
  phone?: string;
};

type StudentPickerProps = {
  students: StudentItem[];
};

export default function StudentPicker({ students }: StudentPickerProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleSelect = (studentId: string) => {
    setPendingId(studentId);
    router.push(`/asesorado?student=${studentId}`);
  };

  return (
    <section className="mt-6 flex flex-col gap-2" aria-busy={pendingId !== null}>
      {students.map((student) => {
        const isPending = pendingId === student.id;
        return (
          <button
            key={student.id}
            type="button"
            onClick={() => handleSelect(student.id)}
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
              ) : null}
            </div>
          </button>
        );
      })}
    </section>
  );
}
