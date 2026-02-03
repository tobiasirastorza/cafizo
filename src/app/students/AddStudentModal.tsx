"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const PB_BASE = "http://127.0.0.1:8090/api";
const DEFAULT_TRAINER_ID = process.env.NEXT_PUBLIC_DEFAULT_TRAINER_ID ?? "";

function buildUrl(path: string) {
  return `${PB_BASE}${path}`;
}

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddStudentModal({
  isOpen,
  onClose,
  onSuccess,
}: AddStudentModalProps) {
  const t = useTranslations("Clients");
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!studentName.trim()) {
      setError(t("errors.nameRequired"));
      return;
    }

    if (!phone.trim()) {
      setError(t("errors.phoneRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(buildUrl("/collections/students/records"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studentName.trim(),
          phone: phone.trim(),
          status: "active",
          trainer_id: DEFAULT_TRAINER_ID,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create student");
      }

      const student = await res.json();
      setStudentName("");
      setPhone("");
      onSuccess?.();
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
      setStudentName("");
      setPhone("");
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md border-2 border-border bg-background p-8 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
            {t("modal.title")}
          </h2>
        </div>

        <div className="space-y-6">
          <input
            id="studentName"
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder={t("placeholders.fullName")}
            className="h-12 w-full border-b-2 border-border bg-transparent px-1 text-xl font-semibold uppercase tracking-tight text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            autoFocus
          />

          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("placeholders.phone")}
            className="h-12 w-full border-b-2 border-border bg-transparent px-1 text-xl font-semibold uppercase tracking-tight text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSubmitting) {
                handleSubmit();
              }
            }}
          />

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
            disabled={!studentName.trim() || !phone.trim() || isSubmitting}
            className="inline-flex h-12 items-center justify-center border-2 border-accent bg-accent px-8 text-sm font-black uppercase tracking-[0.2em] text-accent-foreground transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("actions.creating") : t("actions.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
