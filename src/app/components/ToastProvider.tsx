"use client";

import { Toaster, toast } from "sonner";

type ToastKind = "success" | "error";

type ToastApi = {
  show: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors={false}
        closeButton
        expand={false}
        toastOptions={{
          duration: 2800,
          className: "border border-border bg-background-card text-foreground rounded-md",
        }}
      />
    </>
  );
}

export function useToast() {
  const api: ToastApi = {
    show: (kind, message) => {
      if (kind === "success") {
        toast.success(message);
        return;
      }
      toast.error(message);
    },
    success: (message) => toast.success(message),
    error: (message) => toast.error(message),
  };

  return api;
}
