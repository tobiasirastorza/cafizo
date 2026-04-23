"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/app/components/ToastProvider";

const PB_BASE = "http://35.209.214.205:8090/api";
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
  const toast = useToast();
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

      await res.json();
      setStudentName("");
      setPhone("");
      onSuccess?.();
      onClose();
      toast.success(t("actions.created"));
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("errors.generic");
      setError(message);
      toast.error(message);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-md border border-border bg-background-card p-8 shadow-md rounded-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {t("modal.title")}
          </h2>
        </div>

        <div className="space-y-4">
          <input
            id="studentName"
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder={t("placeholders.fullName")}
            className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-ring focus:outline-none rounded-md"
            autoFocus
          />

          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("placeholders.phone")}
            className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-ring focus:outline-none rounded-md"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSubmitting) {
                handleSubmit();
              }
            }}
          />

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
            disabled={!studentName.trim() || !phone.trim() || isSubmitting}
            className="inline-flex h-10 items-center justify-center border border-accent bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
          >
            {isSubmitting ? t("actions.creating") : t("actions.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
